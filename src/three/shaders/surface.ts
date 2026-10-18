import { NOISE_GLSL } from './noise'

/**
 * Procedural surface "bake" shader. Rendered once per body into an
 * equirectangular render target that matches three.js SphereGeometry UVs,
 * so the result is seamless and can be used as a regular texture map.
 *
 * These are artistic approximations informed by spacecraft imagery —
 * not real surface maps.
 */
export const SURFACE_KINDS = {
  cratered: 0,
  venus: 1,
  mars: 3,
  gas: 4,
  ice: 5,
  io: 6,
  europa: 7,
  ganymede: 8,
  titan: 9,
  enceladus: 10,
  triton: 11,
  pluto: 12,
  ceres: 13,
} as const

export type SurfaceKind = keyof typeof SURFACE_KINDS

export const BAKE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

export const BAKE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform int uKind;
uniform int uOut; // 0 = colour, 1 = height
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
uniform float uSeed;
uniform vec4 uP; // per-recipe parameters

${NOISE_GLSL}

const float PI = 3.14159265359;

vec3 spherePoint(vec2 uv){
  float phi = uv.x * 2.0 * PI;
  float theta = (1.0 - uv.y) * PI;
  return vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
}
vec3 toLinear(vec3 c){ return pow(c, vec3(2.2)); }

// multi-octave crater field: returns height offset, writes ejecta brightness
float craters(vec3 p, float density, float depth, out float ray){
  float h = 0.0; ray = 0.0;
  float freq = density; float amp = depth;
  for(int o = 0; o < 4; o++){
    vec2 w = worley(p * freq + float(o) * 13.1 + uSeed);
    float r = 0.18 + 0.28 * w.y;            // crater radius in cell units
    float present = step(0.35, fract(w.y * 7.31)); // not every cell has a crater
    float d = w.x / r;
    float bowl = (1.0 - smoothstep(0.0, 1.0, d)) * (1.0 - d * d * 0.5);
    float rim = exp(-pow((d - 1.0) * 4.0, 2.0));
    h += present * amp * (rim * 0.45 - bowl * 0.9);
    ray += present * exp(-d * 1.6) * (0.6 / float(o + 1));
    freq *= 2.15; amp *= 0.5;
  }
  return h;
}

// 2-D distance on the sphere surface between point p and a feature at lat/lon (radians)
float spotDist(vec3 p, float lat, float lon){
  vec3 c = vec3(-cos(lon) * cos(lat), sin(lat), sin(lon) * cos(lat));
  return acos(clamp(dot(p, c), -1.0, 1.0));
}

void main(){
  vec3 p = spherePoint(vUv);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float lon = vUv.x * 2.0 * PI;
  vec3 col = vec3(0.5);
  float h = 0.5;
  vec3 q = p + vec3(uSeed * 0.37, uSeed * 0.11, uSeed * 0.73);

  if (uKind == 0 || uKind == 13) {
    // cratered rocky / icy body (Mercury, Callisto, Phobos, Deimos, Titania, Ceres)
    float n = fbm(q * 2.2, 6);
    float n2 = fbm(q * 9.0, 4);
    float ray;
    float c = craters(q, uP.x, 1.0, ray);
    h = 0.5 + n * 0.25 + c * 0.35 + n2 * 0.05;
    float t = smoothstep(-0.35, 0.45, n + n2 * 0.25);
    col = mix(uC1, uC2, t);
    col = mix(col, uC3, smoothstep(0.2, 0.9, ray) * uP.y);   // bright ejecta
    col *= 0.85 + 0.3 * clamp(h, 0.0, 1.0);
    if (uKind == 13) { // Ceres: Occator bright faculae
      float d = spotDist(p, 0.35, 4.2);
      col = mix(col, uC4, smoothstep(0.035, 0.0, d) + 0.6 * smoothstep(0.07, 0.0, spotDist(p, 0.33, 4.12)));
    }
  }
  else if (uKind == 1) {
    // Venus: thick sulfuric-acid cloud deck with soft chevrons
    vec3 w = q * vec3(1.0, 3.0, 1.0);
    float warp = fbm(w * 1.5, 5);
    float bands = sin(lat * 9.0 + warp * 3.0 + lon * 0.0);
    float n = fbm(q * 3.0 + warp * 1.4, 6);
    col = mix(uC1, uC2, smoothstep(-0.6, 0.7, n + bands * 0.15));
    col = mix(col, uC3, smoothstep(0.35, 0.8, fbm(q * 6.0 + warp, 4)) * 0.45);
    h = 0.5;
  }
  else if (uKind == 3) {
    // Mars: rust plains, dark albedo regions, cratered southern highlands, polar caps
    float n = fbm(q * 1.8, 7);
    float dark = smoothstep(0.05, 0.35, fbm(q * 1.2 + 3.0, 5) - p.y * 0.25);
    float ray;
    float c = craters(q, 6.0, 1.0, ray) * smoothstep(0.2, -0.4, p.y);
    float valles = exp(-pow((lat + 0.14 + fbm(q * 6.0, 3) * 0.02) * 40.0, 2.0)) * smoothstep(1.6, 2.2, lon) * smoothstep(3.0, 2.4, lon);
    h = 0.5 + n * 0.3 + c * 0.25 - valles * 0.5;
    col = mix(uC1, uC2, smoothstep(-0.4, 0.6, n));
    col = mix(col, uC3, dark * 0.7);
    col *= 0.9 + 0.25 * clamp(h - 0.3, 0.0, 1.0);
    // Olympus Mons & Tharsis: slightly brighter, raised
    float om = spotDist(p, 0.32, 3.9);
    h += smoothstep(0.12, 0.0, om) * 0.4;
    float cap = smoothstep(uP.x, uP.x + 0.025, abs(p.y) + fbm(q * 6.0, 4) * 0.035);
    col = mix(col, uC4, cap);
    h = mix(h, 0.62, cap);
  }
  else if (uKind == 4) {
    // Gas giant: latitudinal belts & zones, turbulent eddies, optional Great Red Spot
    float turb = uP.x;
    vec3 tq = q * vec3(2.0, 0.6, 2.0);
    float eddy = fbm(tq * 3.0 + fbm(q * 4.0, 4) * 1.5, 6);
    float y = p.y + eddy * 0.035 * turb;
    float b1 = sin(y * uP.y + fbm(vec3(y * 6.0, uSeed, 0.0), 3) * 1.2);
    float b2 = sin(y * uP.y * 2.3 + 1.7);
    float bands = b1 * 0.7 + b2 * 0.3;
    col = mix(uC1, uC2, smoothstep(-0.8, 0.8, bands));
    col = mix(col, uC3, smoothstep(0.55, 1.0, b2 * b1) * 0.6);
    // fine streaks
    float streak = fbm(vec3(lon * 3.0, y * 60.0, uSeed), 4);
    col *= 0.92 + 0.12 * streak;
    // polar darkening
    col = mix(col, uC4, smoothstep(0.65, 1.0, abs(p.y)) * 0.7);
    if (uP.z > 0.5) {
      // Great Red Spot near 22°S
      vec2 d = vec2((lon - 3.6) * cos(lat) / 0.17, (lat + 0.39) / 0.075);
      float r = length(d);
      float swirl = fbm(vec3(d * 0.8, uSeed) + vec3(atan(d.y, d.x) * 0.5, r, 0.0), 4);
      float spot = smoothstep(1.15, 0.65, r + swirl * 0.2);
      col = mix(col, vec3(0.74, 0.36, 0.22), spot * 0.85);
      col = mix(col, vec3(0.93, 0.85, 0.74), smoothstep(1.35, 1.1, r) * smoothstep(1.0, 1.15, r) * 0.6);
      // white ovals
      for (int k = 0; k < 4; k++) {
        float fk = float(k);
        vec2 dd = vec2((lon - 1.0 - fk * 1.4) * cos(lat) / 0.05, (lat + 0.58) / 0.03);
        col = mix(col, vec3(0.95, 0.93, 0.88), smoothstep(1.0, 0.5, length(dd)) * 0.8);
      }
    }
    h = 0.5;
  }
  else if (uKind == 5) {
    // Ice giant: subtle, low-contrast banding
    float eddy = fbm(q * vec3(3.0, 1.0, 3.0), 5);
    float y = p.y + eddy * 0.02;
    float bands = sin(y * uP.y) * 0.5 + 0.5;
    col = mix(uC1, uC2, bands * uP.x);
    col = mix(col, uC3, smoothstep(0.7, 1.0, abs(p.y)) * 0.5);
    // sparse bright methane-ice cloud streaks
    float clouds = smoothstep(0.55, 0.8, fbm(vec3(lon * 2.0, y * 30.0, uSeed), 5)) * uP.z;
    col = mix(col, uC4, clouds);
    h = 0.5;
  }
  else if (uKind == 6) {
    // Io: sulfur plains with volcanic centres
    float n = fbm(q * 2.5, 6);
    col = mix(uC1, uC2, smoothstep(-0.5, 0.6, n));
    vec2 w = worley(q * 6.0 + fbm(q * 9.0, 3) * 0.35);
    float live = step(0.55, w.y);
    float vent = smoothstep(0.05 + 0.07 * fract(w.y * 9.1), 0.0, w.x) * live;
    float halo = smoothstep(0.42, 0.08, w.x + fbm(q * 14.0, 3) * 0.12) * live;
    col = mix(col, uC3, halo * 0.45);
    col = mix(col, uC4, vent * 0.9);
    col = mix(col, vec3(0.55, 0.5, 0.45), smoothstep(0.75, 1.0, abs(p.y)) * 0.5);
    h = 0.5 + n * 0.12 - vent * 0.15;
  }
  else if (uKind == 7) {
    // Europa: bright ice crossed by reddish lineae
    float n = fbm(q * 2.0, 5);
    col = mix(uC1, uC2, smoothstep(-0.3, 0.7, n));
    float lines = 0.0;
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float r = 1.0 - abs(snoise(q * (2.5 + fk * 2.7) + fk * 5.0));
      lines += pow(r, 28.0 + fk * 10.0) * (1.0 - fk * 0.25);
    }
    col = mix(col, uC3, clamp(lines, 0.0, 1.0) * 0.85);
    float chaos = smoothstep(0.35, 0.6, fbm(q * 3.5 + 7.0, 5));
    col = mix(col, uC4, chaos * 0.5);
    h = 0.5 + lines * 0.12 - chaos * 0.05;
  }
  else if (uKind == 8) {
    // Ganymede: dark ancient terrain + bright grooved terrain
    float region = smoothstep(-0.05, 0.15, fbm(q * 1.6, 5));
    float grooves = pow(1.0 - abs(snoise(q * vec3(14.0, 3.0, 14.0) + fbm(q * 3.0, 3))), 6.0);
    float ray;
    float c = craters(q, 5.0, 1.0, ray);
    col = mix(uC1, uC2, region);
    col *= 0.9 + 0.2 * grooves * region;
    col = mix(col, uC3, smoothstep(0.3, 0.9, ray) * 0.6);
    col = mix(col, uC4, smoothstep(0.78, 0.95, abs(p.y)) * 0.6);
    h = 0.5 + c * 0.3 + grooves * region * 0.1;
  }
  else if (uKind == 9) {
    // Titan: we see the orange photochemical haze, not the surface
    float bands = sin(p.y * 4.0 + fbm(q * 2.0, 4) * 0.6);
    col = mix(uC1, uC2, smoothstep(-1.0, 1.0, bands) * 0.6 + fbm(q * 3.0, 4) * 0.15);
    col = mix(col, uC3, smoothstep(0.6, 1.0, p.y) * 0.4); // darker northern hood
    h = 0.5;
  }
  else if (uKind == 10) {
    // Enceladus: brilliant ice, tiger stripes near the south pole
    float n = fbm(q * 3.0, 5);
    float ray;
    float c = craters(q, 6.0, 1.0, ray) * smoothstep(-0.2, 0.4, p.y);
    col = mix(uC1, uC2, smoothstep(-0.4, 0.6, n));
    float stripes = 0.0;
    for (int k = 0; k < 4; k++) {
      float fk = float(k);
      float lineLat = -1.22 - fk * 0.07;
      float lonOff = sin(lon * 1.0 + fk) * 0.04;
      stripes += exp(-pow((lat - lineLat - lonOff) * 120.0, 2.0)) * smoothstep(-0.7, -0.85, p.y);
    }
    col = mix(col, uC3, clamp(stripes, 0.0, 1.0) * 0.8);
    h = 0.5 + c * 0.25 + n * 0.05 - stripes * 0.2;
  }
  else if (uKind == 11) {
    // Triton: cantaloupe terrain, pinkish south polar cap with dark streaks
    vec2 w = worley(q * 9.0);
    float cant = smoothstep(0.0, 0.5, w.x);
    float n = fbm(q * 2.5, 5);
    col = mix(uC1, uC2, smoothstep(-0.4, 0.6, n));
    col *= 0.9 + 0.12 * cant;
    float cap = smoothstep(-0.05, -0.35, p.y + n * 0.1);
    col = mix(col, uC3, cap);
    float streaks = smoothstep(0.75, 0.95, fbm(vec3(lon * 6.0, p.y * 2.0, uSeed), 4)) * cap;
    col = mix(col, uC4, streaks * 0.8);
    h = 0.5 + cant * 0.1 + n * 0.1;
  }
  else if (uKind == 12) {
    // Pluto: bright Tombaugh Regio "heart", dark reddish equatorial belt
    float n = fbm(q * 2.2, 6);
    col = mix(uC1, uC2, smoothstep(-0.4, 0.6, n));
    float belt = smoothstep(0.5, 0.15, abs(lat + 0.05 + n * 0.12));
    col = mix(col, uC3, belt * 0.85);
    float heart = smoothstep(0.42, 0.3, spotDist(p, 0.3, 3.0) + n * 0.08);
    heart = max(heart, smoothstep(0.32, 0.22, spotDist(p, 0.18, 3.55) + n * 0.08));
    col = mix(col, uC4, heart);
    float ray;
    float c = craters(q, 5.0, 1.0, ray) * (1.0 - heart);
    h = 0.5 + n * 0.2 + c * 0.25;
  }

  if (uOut == 1) gl_FragColor = vec4(vec3(clamp(h, 0.0, 1.0)), 1.0);
  else gl_FragColor = vec4(toLinear(clamp(col, 0.0, 1.0)), 1.0);
}
`
