import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, ShaderMaterial } from 'three'
import { BODY_MAP } from '@/data/bodies'
import { sim } from '@/store/sim'
import { useStore } from '@/store/useStore'

/*
 * GPU-animated belt particles. Each instance carries Keplerian elements;
 * the vertex shader advances its mean anomaly every frame, so thousands of
 * bodies cost almost nothing on the CPU. Representative only: the number
 * and size of particles are not to scale.
 */

const VERT = /* glsl */ `
attribute vec4 aOrb;   // a (AU), e, inclination, node
attribute vec4 aPh;    // M0, argument of perihelion, size, seed
uniform float uDays; uniform float uMode; uniform float uSize; uniform float uTime;
varying vec3 vN; varying vec3 vWorld; varying float vSeed;
#include <common>
#include <logdepthbuf_pars_vertex>
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
void main(){
  float a = aOrb.x; float e = aOrb.y; float inc = aOrb.z; float node = aOrb.w;
  float n = 6.2831853 / (365.256 * pow(a, 1.5));
  float M = mod(aPh.x + n * uDays, 6.2831853);
  float E = M + e * sin(M) + 0.5 * e * e * sin(2.0 * M);
  float xp = a * (cos(E) - e);
  float yp = a * sqrt(1.0 - e * e) * sin(E);
  float w = aPh.y;
  float cw = cos(w), sw = sin(w), cO = cos(node), sO = sin(node), cI = cos(inc), sI = sin(inc);
  float x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  float y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  float z = sw * sI * xp + cw * sI * yp;
  vec3 P = vec3(x, z, -y);
  float r = length(P);
  float rs = uMode > 0.5 ? r * 1000.0 : 10.0 + 26.0 * pow(r, 0.62);
  P *= rs / r;
  mat3 R = rotY(aPh.w * 40.0 + uTime * (0.2 + aPh.w)) * rotX(aPh.w * 17.0);
  vec3 local = R * (position * vec3(1.0, 0.7 + aPh.w * 0.5, 0.85));
  vN = R * normalize(position);
  vec4 world = modelMatrix * vec4(P + local * aPh.z * uSize, 1.0);
  vWorld = world.xyz;
  vSeed = aPh.w;
  gl_Position = projectionMatrix * viewMatrix * world;
  #include <logdepthbuf_vertex>
}
`
const FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform float uOpacity;
varying vec3 vN; varying vec3 vWorld; varying float vSeed;
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec3 L = normalize(-vWorld);
  float d = max(dot(normalize(vN), L), 0.0);
  vec3 col = mix(uA, uB, fract(vSeed * 13.7));
  gl_FragColor = vec4(col * (0.08 + d * 1.1) * uOpacity, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const rockGeo = new IcosahedronGeometry(1, 0)

function rand(seed: { s: number }) {
  // mulberry32
  let t = (seed.s += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

type BeltKind = 'main' | 'trojans' | 'kuiper'

function buildBelt(kind: BeltKind, count: number) {
  const orb = new Float32Array(count * 4)
  const ph = new Float32Array(count * 4)
  const seed = { s: kind === 'main' ? 7 : kind === 'trojans' ? 99 : 1234 }
  const DEG = Math.PI / 180
  // Kirkwood gaps (AU) — resonances with Jupiter (4:1, 3:1, 5:2, 7:3, 2:1)
  const gaps = [2.06, 2.5, 2.82, 2.95, 3.27]
  const jup = BODY_MAP.jupiter.orbit!
  for (let i = 0; i < count; i++) {
    let a = 0, e = 0, inc = 0, M0 = 0, w = 0
    const node = rand(seed) * Math.PI * 2
    if (kind === 'main') {
      do a = 2.1 + Math.pow(rand(seed), 0.9) * 1.2
      while (gaps.some((g) => Math.abs(a - g) < 0.025 + rand(seed) * 0.01))
      e = rand(seed) * 0.18
      inc = Math.abs((rand(seed) + rand(seed) - 1) * 14) * DEG
      M0 = rand(seed) * Math.PI * 2
      w = rand(seed) * Math.PI * 2
    } else if (kind === 'trojans') {
      a = jup.a + (rand(seed) - 0.5) * 0.3
      e = rand(seed) * 0.1
      inc = Math.abs((rand(seed) + rand(seed) - 1) * 25) * DEG
      // lead (L4) or trail (L5) Jupiter's mean longitude by ~60°
      const side = rand(seed) < 0.6 ? 60 : -60
      const L = (jup.L + side + (rand(seed) + rand(seed) - 1) * 26) * DEG
      w = rand(seed) * Math.PI * 2
      M0 = L - (w + node)
    } else {
      const plutino = rand(seed) < 0.3
      a = plutino ? 39.4 + (rand(seed) - 0.5) * 0.6 : 42 + rand(seed) * 6 + (rand(seed) < 0.2 ? -10 * rand(seed) : 0)
      e = plutino ? 0.1 + rand(seed) * 0.2 : rand(seed) * 0.1
      inc = Math.abs((rand(seed) + rand(seed) - 1) * (plutino ? 30 : 12)) * DEG
      M0 = rand(seed) * Math.PI * 2
      w = rand(seed) * Math.PI * 2
    }
    orb.set([a, e, inc, node], i * 4)
    const size = 0.25 + Math.pow(rand(seed), 6) * 1.6
    ph.set([M0, w, size, rand(seed)], i * 4)
  }
  return { orb, ph }
}

const STYLE: Record<BeltKind, { a: string; b: string; count: number; size: [number, number] }> = {
  main: { a: '#6d655b', b: '#a0968a', count: 6500, size: [0.11, 0.5] },
  trojans: { a: '#5e574f', b: '#8a7f73', count: 1400, size: [0.13, 0.6] },
  kuiper: { a: '#7d8590', b: '#b8b2ac', count: 5200, size: [0.3, 1.6] },
}

function BeltField({ kind }: { kind: BeltKind }) {
  const quality = useStore((s) => s.quality)
  const style = STYLE[kind]
  const count = quality === 'high' ? style.count : Math.round(style.count * 0.45)
  const mesh = useMemo(() => {
    const { orb, ph } = buildBelt(kind, count)
    const g = rockGeo.clone()
    g.setAttribute('aOrb', new InstancedBufferAttribute(orb, 4))
    g.setAttribute('aPh', new InstancedBufferAttribute(ph, 4))
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDays: { value: 0 }, uMode: { value: 0 }, uSize: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 },
        uA: { value: new Color(style.a) }, uB: { value: new Color(style.b) },
      },
    })
    const m = new InstancedMesh(g, mat, count)
    const id = new Matrix4()
    for (let i = 0; i < count; i++) m.setMatrixAt(i, id)
    m.frustumCulled = false
    m.raycast = () => null
    return m
  }, [kind, count, style.a, style.b])

  useFrame((state) => {
    const u = (mesh.material as ShaderMaterial).uniforms
    const mode = useStore.getState().scaleMode
    u.uDays.value = sim.days
    u.uTime.value = state.clock.elapsedTime
    u.uMode.value = mode === 'true' ? 1 : 0
    u.uSize.value = mode === 'true' ? style.size[1] : style.size[0]
  })

  return <primitive object={mesh} />
}

export function Belts() {
  const show = useStore((s) => s.showBelts)
  if (!show) return null
  return (
    <>
      <BeltField kind="main" />
      <BeltField kind="trojans" />
      <BeltField kind="kuiper" />
    </>
  )
}
