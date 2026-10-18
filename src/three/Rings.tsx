import { useMemo } from 'react'
import { DoubleSide, RingGeometry, ShaderMaterial, Vector3 } from 'three'

type RingKind = 'saturn' | 'uranus' | 'neptune' | 'jupiter'

/** Ring extents in units of the planet's equatorial radius (from published ring radii). */
const EXTENT: Record<RingKind, [number, number]> = {
  saturn: [1.11, 2.35],
  uranus: [1.6, 2.03],
  neptune: [1.65, 2.56],
  jupiter: [1.29, 3.16],
}

const VERT = /* glsl */ `
varying vec3 vLocal; varying vec3 vViewPos;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`

const FRAG = /* glsl */ `
uniform int uKind; uniform vec3 uSunViewPos; uniform vec3 uCenterView; uniform float uPlanetR; uniform vec3 uNormalView;
varying vec3 vLocal; varying vec3 vViewPos;
#include <logdepthbuf_pars_fragment>
float hash(float n){ return fract(sin(n) * 43758.5453); }
float noise1(float x){ float i = floor(x); float f = fract(x); return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f)); }
float band(float r, float a, float b, float soft){ return smoothstep(a - soft, a + soft, r) * (1.0 - smoothstep(b - soft, b + soft, r)); }
float line(float r, float c, float w){ return exp(-pow((r - c) / w, 2.0)); }

void main(){
  #include <logdepthbuf_fragment>
  float r = length(vLocal.xy); // in planet radii
  float ringlets = noise1(r * 320.0) * 0.45 + noise1(r * 90.0) * 0.55;
  vec3 col; float a = 0.0;
  if (uKind == 0) {
    // Saturn: D, C, B, Cassini Division, A (Encke & Keeler gaps), F
    float D = band(r, 1.11, 1.236, 0.004) * 0.04;
    float C = band(r, 1.239, 1.527, 0.004) * (0.14 + 0.12 * ringlets);
    float B = band(r, 1.527, 1.951, 0.003) * (0.62 + 0.25 * smoothstep(1.53, 1.75, r) + 0.12 * ringlets);
    float CD = band(r, 1.951, 2.027, 0.003) * 0.06;
    float A = band(r, 2.027, 2.269, 0.003) * (0.5 + 0.12 * ringlets);
    A *= 1.0 - line(r, 2.217, 0.0025) * 0.95;
    A *= 1.0 - line(r, 2.264, 0.0008) * 0.9;
    float F = line(r, 2.326, 0.003) * 0.45;
    a = D + C + B + CD + A + F;
    vec3 cC = vec3(0.55, 0.50, 0.44), cB = vec3(0.86, 0.78, 0.64), cA = vec3(0.74, 0.70, 0.64);
    col = mix(cC, cB, smoothstep(1.50, 1.56, r));
    col = mix(col, cA, smoothstep(1.98, 2.04, r));
    col *= 0.85 + 0.3 * ringlets;
  } else if (uKind == 1) {
    // Uranus: narrow dark rings 6,5,4, alpha, beta, eta, gamma, delta, epsilon
    float w = 0.0018;
    a = (line(r, 1.637, w) + line(r, 1.652, w) + line(r, 1.666, w) + line(r, 1.750, w) + line(r, 1.786, w) + line(r, 1.847, w) * 0.6 + line(r, 1.863, w) + line(r, 1.909, w)) * 0.45 + line(r, 2.001, 0.006) * 0.75;
    col = vec3(0.45, 0.47, 0.5);
  } else if (uKind == 2) {
    // Neptune: Galle, Le Verrier, Lassell (broad), Arago, Adams
    a = line(r, 1.69, 0.012) * 0.12 + line(r, 2.148, 0.004) * 0.3 + band(r, 2.15, 2.31, 0.01) * 0.05 + line(r, 2.31, 0.003) * 0.15 + line(r, 2.541, 0.0035) * 0.35;
    col = vec3(0.5, 0.48, 0.47);
  } else {
    // Jupiter: halo, main ring, gossamer rings — very faint dust
    a = band(r, 1.29, 1.71, 0.05) * 0.03 + band(r, 1.71, 1.806, 0.01) * 0.12 + band(r, 1.806, 3.16, 0.1) * 0.015;
    col = vec3(0.62, 0.52, 0.42);
  }
  // planet shadow on the rings
  vec3 toSun = normalize(uSunViewPos - vViewPos);
  vec3 oc = uCenterView - vViewPos;
  float t = dot(oc, toSun);
  float dist = length(vViewPos + toSun * t - uCenterView);
  float shadow = t > 0.0 ? smoothstep(uPlanetR * 0.97, uPlanetR * 1.03, dist) : 1.0;
  // lit vs unlit face: sunlight transmitted through the ring is dimmer
  vec3 v = normalize(-vViewPos);
  float sunSide = dot(uNormalView, toSun);
  float viewSide = dot(uNormalView, v);
  float lit = sign(sunSide) == sign(viewSide) ? 1.0 : 0.35 + 0.4 * (1.0 - a);
  float incidence = 0.35 + 0.65 * abs(sunSide);
  gl_FragColor = vec4(col * lit * incidence * (0.12 + 0.88 * shadow) * 1.15, clamp(a, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function useRing(kind: RingKind, sunViewPos: Vector3, centerView: Vector3, normalView: Vector3) {
  return useMemo(() => {
    const [inner, outer] = EXTENT[kind]
    const geometry = new RingGeometry(inner, outer, 256, 1)
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uKind: { value: ['saturn', 'uranus', 'neptune', 'jupiter'].indexOf(kind) },
        uSunViewPos: { value: sunViewPos },
        uCenterView: { value: centerView },
        uNormalView: { value: normalView },
        uPlanetR: { value: 1 },
      },
    })
    return { geometry, material, outer }
  }, [kind, sunViewPos, centerView, normalView])
}

export const ringOuter = (kind?: RingKind) => (kind ? EXTENT[kind][1] : 1)
