import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  Color, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, Quaternion, SRGBColorSpace, SphereGeometry, Texture, Vector3,
} from 'three'
import type { Body as BodyData } from '@/data/types'
import { positions, sceneRadius } from '@/store/sim'
import { useStore } from '@/store/useStore'
import { RECIPES, type RenderRecipe } from './recipes'
import { bakeSurface } from './bake'
import { spin } from './SystemClock'
import { useAtmosphereMaterials } from './Atmosphere'
import { useRing } from './Rings'

const DEG = Math.PI / 180
const sphereHi = new SphereGeometry(1, 96, 64)
const sphereLo = new SphereGeometry(1, 48, 32)
const hitSphere = new SphereGeometry(1, 12, 8)

const _v = new Vector3()
const _q = new Quaternion()

function lumpyGeometry(amount: number, seed: number) {
  const g = new IcosahedronGeometry(1, 5)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i)
    const n = Math.sin(_v.x * 3.1 + seed) * Math.cos(_v.y * 2.3 - seed) + 0.5 * Math.sin(_v.z * 5.7 + seed * 2)
    const s = 1 + amount * (n * 0.5 + (_v.x * 0.35))
    p.setXYZ(i, _v.x * s, _v.y * s * 0.85, _v.z * s * 0.9)
  }
  g.computeVertexNormals()
  // equirect UVs from direction so baked maps still apply
  const uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i).normalize()
    const u = (Math.atan2(_v.z, -_v.x) / (2 * Math.PI) + 1) % 1
    const v = 1 - Math.acos(_v.y) / Math.PI
    uv.setXY(i, u, 1 - v)
  }
  return g
}

/** Material for real-texture bodies (Earth, Moon). */
function TexturedMaterial({ recipe, sunView, onReady }: { recipe: RenderRecipe; sunView: Vector3; onReady: (m: MeshStandardMaterial, clouds?: Texture) => void }) {
  const t = recipe.textures!
  const urls = [t.map, t.normal, t.specular, t.lights, t.clouds].filter(Boolean) as string[]
  const loaded = useTexture(urls) as Texture[]
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const byUrl = Object.fromEntries(urls.map((u, i) => [u, loaded[i]]))
    const map = byUrl[t.map]
    map.colorSpace = SRGBColorSpace
    map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const mat = new MeshStandardMaterial({ map, roughness: recipe.roughness ?? 1, metalness: 0 })
    if (t.bumpFromMap) {
      mat.bumpMap = map
      mat.bumpScale = t.bumpFromMap
    }
    if (t.normal) {
      mat.normalMap = byUrl[t.normal]
      mat.normalScale.set(0.85, -0.85)
    }
    if (t.specular) mat.roughnessMap = byUrl[t.specular]
    if (t.lights) {
      const lights = byUrl[t.lights]
      lights.colorSpace = SRGBColorSpace
      mat.emissiveMap = lights
      mat.emissive = new Color('#ffcf8a')
      mat.emissiveIntensity = 1.6
    }
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunView = { value: sunView }
      shader.fragmentShader = 'uniform vec3 uSunView;\n' + shader.fragmentShader
      if (t.specular) {
        // specular map: white = water. Oceans are glossy, land is rough.
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  float waterMask = texture2D( roughnessMap, vRoughnessMapUv ).r;
  roughnessFactor = mix( roughness, 0.38, waterMask );
#endif`,
        )
      }
      if (t.lights) {
        // city lights only on the night side
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
  float nightMask = smoothstep( 0.12, -0.18, dot( normal, uSunView ) );
  totalEmissiveRadiance *= emissiveColor.rgb * nightMask;
#endif`,
        )
      }
    }
    onReady(mat, t.clouds ? byUrl[t.clouds] : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])
  return null
}

export function Body({ body }: { body: BodyData }) {
  const recipe = RECIPES[body.id] ?? {}
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const quality = useStore((s) => s.quality)
  const outer = useRef<Group>(null!)
  const tilted = useRef<Group>(null!)
  const surface = useRef<Mesh>(null!)
  const clouds = useRef<Mesh>(null!)
  const halo = useRef<Mesh>(null!)
  const haze = useRef<Mesh>(null!)
  const ringMesh = useRef<Mesh>(null!)
  const hit = useRef<Mesh>(null!)

  // view-space vectors shared with shaders, updated every frame
  const sunView = useMemo(() => new Vector3(), [])
  const sunViewPos = useMemo(() => new Vector3(), [])
  const centerView = useMemo(() => new Vector3(), [])
  const ringNormalView = useMemo(() => new Vector3(), [])

  const geometry = useMemo(() => (recipe.lumpy ? lumpyGeometry(recipe.lumpy, recipe.surface?.seed ?? 1) : body.kind === 'moon' ? sphereLo : sphereHi), [recipe.lumpy, recipe.surface?.seed, body.kind])

  const bakedMaterial = useMemo(() => {
    if (!recipe.surface) return null
    const size = body.kind === 'moon' || body.kind === 'dwarf' ? (quality === 'high' ? 1024 : 512) : quality === 'high' ? 2048 : 1024
    const { map, bump } = bakeSurface(gl, body.id, recipe.surface, size)
    const mat = new MeshStandardMaterial({ map, roughness: recipe.roughness ?? 0.92, metalness: 0 })
    if (bump) {
      mat.bumpMap = bump
      mat.bumpScale = recipe.surface.bump ?? 1
    }
    return mat
  }, [gl, body.id, body.kind, recipe.surface, recipe.roughness, quality])

  const atmo = recipe.atmosphere
  const atmoMats = useAtmosphereMaterials(atmo?.color ?? '#ffffff', atmo?.intensity ?? 0, atmo?.thickness ?? 0, sunView)
  const ring = useRing(recipe.rings ?? 'saturn', sunViewPos, centerView, ringNormalView)

  const onTexturedReady = (m: MeshStandardMaterial, cloudTex?: Texture) => {
    if (surface.current) surface.current.material = m
    if (cloudTex && clouds.current) {
      cloudTex.colorSpace = SRGBColorSpace
      clouds.current.material = new MeshStandardMaterial({ map: cloudTex, transparent: true, depthWrite: false, roughness: 1, metalness: 0, opacity: 0.92 })
      clouds.current.visible = true
    }
  }

  const tilt = body.axialTilt * DEG
  const obl = recipe.oblateness ?? 1

  useFrame(() => {
    const p = positions[body.id]
    const r = sceneRadius[body.id] ?? 1
    outer.current.position.copy(p)
    surface.current.scale.set(r, r * obl, r)
    surface.current.rotation.y = spin[body.id] ?? 0
    // view-space sun direction for night lights / atmosphere / ring shadows
    sunViewPos.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse)
    centerView.copy(p).applyMatrix4(camera.matrixWorldInverse)
    sunView.copy(sunViewPos).sub(centerView).normalize()
    if (clouds.current?.visible) {
      clouds.current.scale.set(r * 1.012, r * 1.012, r * 1.012)
      clouds.current.rotation.y = (spin[body.id] ?? 0) * 1.03 + 0.4
    }
    if (atmo && halo.current) {
      halo.current.scale.setScalar(r * atmoMats.shell)
      haze.current.scale.setScalar(r * 1.004)
      atmoMats.halo.uniforms.uRadius.value = r
    }
    if (recipe.rings && ringMesh.current) {
      ringMesh.current.scale.setScalar(r)
      ring.material.uniforms.uPlanetR.value = r
      ringNormalView.set(0, 1, 0).applyQuaternion(tilted.current.getWorldQuaternion(_q)).transformDirection(camera.matrixWorldInverse)
    }
    const hs = Math.max(r * (recipe.rings ? 2.2 : 1.25), body.kind === 'moon' ? 0.25 : 0.6)
    hit.current.scale.setScalar(useStore.getState().scaleMode === 'true' ? r * 1.2 : hs)
  })

  const travelTo = useStore((s) => s.travelTo)
  const setHovered = useStore((s) => s.setHovered)
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return
    e.stopPropagation()
    travelTo(body.id)
  }

  return (
    <group ref={outer}>
      <group ref={tilted} rotation={[0, 0, tilt]}>
        <mesh ref={surface} geometry={geometry} material={bakedMaterial ?? undefined} raycast={() => null}>
          {!bakedMaterial && <meshStandardMaterial color={body.accent} roughness={1} />}
        </mesh>
        {recipe.textures && <TexturedMaterial recipe={recipe} sunView={sunView} onReady={onTexturedReady} />}
        {recipe.textures?.clouds && <mesh ref={clouds} geometry={sphereLo} visible={false} raycast={() => null} />}
        {atmo && (
          <>
            <mesh ref={halo} geometry={sphereLo} material={atmoMats.halo} raycast={() => null} renderOrder={2} />
            <mesh ref={haze} geometry={sphereLo} material={atmoMats.haze} raycast={() => null} renderOrder={3} />
          </>
        )}
        {recipe.rings && <mesh ref={ringMesh} geometry={ring.geometry} material={ring.material} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null} renderOrder={4} />}
      </group>
      <mesh
        ref={hit}
        geometry={hitSphere}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(body.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = ''
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}

