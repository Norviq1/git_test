import { useMemo } from 'react'
import { AdditiveBlending, BackSide, Color, FrontSide, ShaderMaterial, Vector3 } from 'three'

/**
 * Two-shell atmospheric glow. The outer back-faced shell computes the
 * ray's closest approach to the planet centre for a soft limb halo; the
 * inner front-faced shell adds Fresnel haze over the disk. Both darken on
 * the night side. Artistic approximation of Rayleigh scattering.
 */
const VERT = /* glsl */ `
varying vec3 vViewPos;
varying vec3 vNormal;
varying vec3 vCenter;
#include <common>
#include <logdepthbuf_pars_vertex>
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`
const HALO_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform float uRadius; uniform float uShell; uniform vec3 uSunView;
varying vec3 vViewPos; varying vec3 vNormal; varying vec3 vCenter;
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec3 dir = normalize(vViewPos);
  float t = dot(vCenter, dir);
  vec3 pc = dir * t;
  float d = length(pc - vCenter) / uRadius;           // 1 at the limb
  float h = clamp((d - 1.0) / (uShell - 1.0), 0.0, 1.0);
  float density = exp(-h * 5.0) * (1.0 - h);
  vec3 n = normalize(pc - vCenter);
  float light = smoothstep(-0.35, 0.55, dot(n, uSunView));
  gl_FragColor = vec4(uColor * density * light * uIntensity, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
const HAZE_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform vec3 uSunView;
varying vec3 vViewPos; varying vec3 vNormal; varying vec3 vCenter;
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  vec3 v = normalize(-vViewPos);
  float fres = pow(1.0 - clamp(dot(vNormal, v), 0.0, 1.0), 3.0);
  float light = smoothstep(-0.25, 0.6, dot(vNormal, uSunView));
  gl_FragColor = vec4(uColor * fres * light * uIntensity * 0.9, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function useAtmosphereMaterials(color: string, intensity: number, thickness: number, sunView: Vector3) {
  return useMemo(() => {
    const shell = 1 + Math.max(thickness * 4, 0.08)
    const c = new Color(color)
    const common = { transparent: true, depthWrite: false, blending: AdditiveBlending }
    const halo = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: HALO_FRAG,
      side: BackSide,
      uniforms: { uColor: { value: c }, uIntensity: { value: intensity }, uRadius: { value: 1 }, uShell: { value: shell }, uSunView: { value: sunView } },
      ...common,
    })
    const haze = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: HAZE_FRAG,
      side: FrontSide,
      uniforms: { uColor: { value: c }, uIntensity: { value: intensity }, uSunView: { value: sunView } },
      ...common,
    })
    return { halo, haze, shell }
  }, [color, intensity, thickness, sunView])
}
