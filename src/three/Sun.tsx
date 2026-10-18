import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, SphereGeometry } from 'three'
import { NOISE_GLSL } from './shaders/noise'
import { sceneRadius } from '@/store/sim'
import { useStore } from '@/store/useStore'
import { spin } from './SystemClock'

/*
 * The Sun: an animated, HDR photosphere (granulation, faculae and limb
 * darkening) plus a camera-facing corona with flickering streamers and
 * flare loops. Artistic rendering — the motion is not a physical model.
 */

const SURFACE_VERT = /* glsl */ `
varying vec3 vObj; varying vec3 vNormal; varying vec3 vViewPos;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vObj = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`
const SURFACE_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vObj; varying vec3 vNormal; varying vec3 vViewPos;
${NOISE_GLSL}
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec3 p = normalize(vObj);
  float t = uTime * 0.04;
  // convection: large supergranules + small granules, slowly evolving
  float warp = fbm(p * 2.0 + vec3(t * 0.6, -t * 0.4, t * 0.3), 4);
  float gran = worley(p * 46.0 + warp * 0.6 + t * 0.8).x;
  float gran2 = worley(p * 95.0 - warp * 0.4 - t * 1.4).x;
  float big = fbm(p * 4.0 + warp + t, 5);
  float cells = (1.0 - smoothstep(0.05, 0.75, gran)) * 0.6 + (1.0 - smoothstep(0.05, 0.8, gran2)) * 0.3;
  // sunspots: rare dark regions in the activity belts
  float lat = abs(p.y);
  float belt = smoothstep(0.08, 0.2, lat) * (1.0 - smoothstep(0.4, 0.55, lat));
  float spotN = fbm(p * 5.5 + vec3(0.0, 0.0, t * 0.2), 4);
  float spot = smoothstep(0.42, 0.6, spotN) * belt;
  float penumbra = smoothstep(0.32, 0.45, spotN) * belt;
  vec3 hot = vec3(1.0, 0.92, 0.72);
  vec3 warm = vec3(1.0, 0.62, 0.22);
  vec3 col = mix(warm, hot, clamp(cells + big * 0.35, 0.0, 1.0));
  col += vec3(1.0, 0.85, 0.5) * smoothstep(0.35, 0.7, big) * 0.35; // faculae
  col = mix(col, col * 0.45, penumbra * 0.6);
  col = mix(col, vec3(0.25, 0.08, 0.02), spot);
  // limb darkening (Eddington approximation)
  float mu = clamp(dot(normalize(vNormal), normalize(-vViewPos)), 0.0, 1.0);
  float limb = 0.4 + 0.6 * mu;
  col *= limb;
  gl_FragColor = vec4(col * 3.2, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const CORONA_VERT = /* glsl */ `
varying vec2 vUv;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vUv = uv * 2.0 - 1.0;
  // camera-facing billboard
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(modelMatrix[0].xyz);
  mv.xy += position.xy * s;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`
const CORONA_FRAG = /* glsl */ `
uniform float uTime; uniform float uInner;
varying vec2 vUv;
${NOISE_GLSL}
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  float r = length(vUv);
  if (r > 1.0) discard;
  float a = atan(vUv.y, vUv.x);
  float x = r / uInner;  // 1 at the photosphere
  float t = uTime * 0.05;
  // streamers: angular noise stretched radially
  float s1 = fbm(vec3(cos(a) * 2.5, sin(a) * 2.5, t), 5);
  float s2 = fbm(vec3(cos(a) * 9.0, sin(a) * 9.0, t * 1.7 - x * 0.25), 4);
  float streamers = pow(max(0.0, s1 * 0.6 + s2 * 0.4 + 0.45), 2.0);
  float falloff = pow(max(x - 0.98, 0.0) + 0.02, -1.35) * 0.012;
  float glow = exp(-(x - 1.0) * 2.4) * 0.65;
  float corona = (glow + falloff) * (0.55 + 1.6 * streamers);
  // flares / prominences: thin bright loops just above the limb
  float loopN = fbm(vec3(cos(a) * 14.0, sin(a) * 14.0, t * 2.0), 4);
  float loops = smoothstep(0.38, 0.62, loopN) * exp(-pow((x - 1.04 - loopN * 0.06) * 28.0, 2.0));
  float inside = smoothstep(0.985, 1.0, x);
  vec3 col = mix(vec3(1.0, 0.55, 0.18), vec3(1.0, 0.85, 0.6), exp(-(x - 1.0) * 3.0));
  vec3 c = col * corona * inside + vec3(1.0, 0.42, 0.12) * loops * 2.2;
  c *= smoothstep(1.0, 0.6, r);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** Screen-space glare so the Sun stays visible as a bright star from the far edge of true scale. */
const GLARE_VERT = /* glsl */ `
uniform float uSize;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
  #include <logdepthbuf_vertex>
}
`
const GLARE_FRAG = /* glsl */ `
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = length(c);
  float g = exp(-d * 5.0) * 1.6 + exp(-d * 14.0) * 3.0;
  float rays = pow(max(0.0, 1.0 - abs(c.x * c.y) * 60.0), 6.0) * (1.0 - d) * 0.6;
  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * (g + rays), 1.0);
}
`
const glareGeo = new BufferGeometry()
glareGeo.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3))

const sunGeo = new SphereGeometry(1, 96, 64)
const quad = new PlaneGeometry(2, 2)

export function Sun() {
  const surface = useRef<Mesh>(null!)
  const corona = useRef<Mesh>(null!)
  const group = useRef<Group>(null!)
  const travelTo = useStore((s) => s.travelTo)
  const setHovered = useStore((s) => s.setHovered)

  const surfaceMat = useMemo(() => new ShaderMaterial({ vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG, uniforms: { uTime: { value: 0 } }, toneMapped: false }), [])
  const coronaMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: CORONA_VERT,
        fragmentShader: CORONA_FRAG,
        uniforms: { uTime: { value: 0 }, uInner: { value: 1 / 4 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )

  const glare = useMemo(() => {
    const p = new Points(
      glareGeo,
      new ShaderMaterial({
        vertexShader: GLARE_VERT,
        fragmentShader: GLARE_FRAG,
        uniforms: { uSize: { value: 40 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    )
    p.frustumCulled = false
    p.raycast = () => null
    p.renderOrder = 6
    return p
  }, [])

  useFrame((state) => {
    const r = sceneRadius.sun ?? 6
    // fade the glare out once the real disk is large on screen
    const dist = state.camera.position.length()
    const px = (r / Math.max(dist * Math.tan((45 * Math.PI) / 360), 1e-6)) * (state.size.height / 2)
    const m = glare.material as ShaderMaterial
    m.uniforms.uSize.value = Math.max(0, 46 - px * 3) * Math.min(state.viewport.dpr, 2)
    glare.visible = px < 14
    const t = state.clock.elapsedTime
    surface.current.scale.setScalar(r)
    surface.current.rotation.y = spin.sun ?? 0
    corona.current.scale.setScalar(r * 4)
    surfaceMat.uniforms.uTime.value = t
    coronaMat.uniforms.uTime.value = t
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return
    e.stopPropagation()
    travelTo('sun')
  }

  return (
    <group ref={group}>
      <mesh
        ref={surface}
        geometry={sunGeo}
        material={surfaceMat}
        rotation={[0, 0, 7.25 * (Math.PI / 180)]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered('sun')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = ''
        }}
      />
      <primitive object={glare} />
      <mesh ref={corona} geometry={quad} material={coronaMat} frustumCulled={false} raycast={() => null} renderOrder={5} />
      <pointLight position={[0, 0, 0]} intensity={3.2} decay={0} distance={0} color="#fff4e6" />
    </group>
  )
}
