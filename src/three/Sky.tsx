import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Group, Points, ShaderMaterial, SphereGeometry } from 'three'
import { NOISE_GLSL } from './shaders/noise'
import { useStore } from '@/store/useStore'

/*
 * Procedural sky: a starfield concentrated toward a Milky Way band (the
 * galactic plane is inclined about 60° to the ecliptic) and a very faint
 * dust/nebula backdrop. Both are artistic — not a catalogue of real stars.
 * Stars do not twinkle: there is no atmosphere in space.
 */

const STAR_VERT = /* glsl */ `
attribute float aSize; attribute vec3 aColor;
uniform float uPixelRatio;
varying vec3 vColor;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio;
  #include <logdepthbuf_vertex>
}
`
const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0) discard;
  float core = exp(-d * 6.0);
  gl_FragColor = vec4(vColor * core, 1.0);
  #include <colorspace_fragment>
}
`

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`
const SKY_FRAG = /* glsl */ `
uniform vec3 uGal;
varying vec3 vDir;
${NOISE_GLSL}
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec3 d = normalize(vDir);
  float b = dot(d, uGal);                     // galactic latitude (sine)
  float band = exp(-b * b * 18.0);
  float n = fbm(d * 3.0, 6);
  float n2 = fbm(d * 7.0 + 4.0, 5);
  float dust = smoothstep(0.1, 0.6, fbm(d * 5.0 + 11.0, 5));
  vec3 milky = vec3(0.55, 0.6, 0.75) * band * (0.55 + 0.45 * n) * (1.0 - dust * 0.75);
  vec3 neb1 = vec3(0.30, 0.12, 0.45) * smoothstep(0.25, 0.75, n) * 0.35;
  vec3 neb2 = vec3(0.05, 0.22, 0.32) * smoothstep(0.3, 0.8, n2) * 0.3;
  vec3 col = milky * 0.012 + (neb1 + neb2) * 0.01 * (0.4 + band);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

// galactic north pole direction in scene axes (ecliptic lat ≈ +29.8°, lon ≈ 180°)
const GAL = (() => {
  const lat = (29.8 * Math.PI) / 180
  const lon = Math.PI
  const x = Math.cos(lat) * Math.cos(lon)
  const y = Math.cos(lat) * Math.sin(lon)
  const z = Math.sin(lat)
  return [x, z, -y] as const
})()

function starColor(t: number) {
  // rough blackbody tint by temperature class
  const c = new Color()
  if (t < 0.12) c.setRGB(0.62, 0.72, 1.0)
  else if (t < 0.35) c.setRGB(0.82, 0.88, 1.0)
  else if (t < 0.7) c.setRGB(1.0, 0.98, 0.94)
  else if (t < 0.9) c.setRGB(1.0, 0.86, 0.66)
  else c.setRGB(1.0, 0.7, 0.48)
  return c
}

export function Sky() {
  const quality = useStore((s) => s.quality)
  const group = useRef<Group>(null!)
  const stars = useMemo(() => {
    const count = quality === 'high' ? 14000 : 7000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const R = 40000
    const g = GAL
    let s = 42
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      let x, y, z, b
      // rejection-sample with extra density near the galactic plane
      do {
        const u = rnd() * 2 - 1
        const th = rnd() * Math.PI * 2
        const r = Math.sqrt(1 - u * u)
        x = r * Math.cos(th); y = u; z = r * Math.sin(th)
        b = x * g[0] + y * g[1] + z * g[2]
      } while (rnd() > 0.35 + 0.65 * Math.exp(-b * b * 14))
      pos.set([x * R, y * R, z * R], i * 3)
      const m = Math.pow(rnd(), 9) // few bright, many faint
      const c = starColor(rnd()).multiplyScalar(0.35 + m * 2.4)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = 1.4 + m * 4.2
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new BufferAttribute(col, 3))
    geo.setAttribute('aSize', new BufferAttribute(size, 1))
    const mat = new ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: false,
    })
    const p = new Points(geo, mat)
    p.frustumCulled = false
    p.renderOrder = -10
    p.raycast = () => null
    return p
  }, [quality])

  const sky = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: { uGal: { value: GAL } },
      side: BackSide,
      depthWrite: false,
      depthTest: false,
    })
    return { geo: new SphereGeometry(45000, 64, 32), mat }
  }, [])

  // the sky is infinitely far away: keep it centred on the camera
  useFrame(({ camera }) => group.current.position.copy(camera.position))

  return (
    <group ref={group}>
      <mesh geometry={sky.geo} material={sky.mat} renderOrder={-11} frustumCulled={false} raycast={() => null} />
      <primitive object={stars} />
    </group>
  )
}
