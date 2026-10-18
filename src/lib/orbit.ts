import type { OrbitalElements } from '@/data/types'

const DEG = Math.PI / 180
export const AU_KM = 149_597_870.7
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
export const DAY_MS = 86_400_000

export const dateToDays = (d: Date) => (d.getTime() - J2000_MS) / DAY_MS
export const daysToDate = (days: number) => new Date(J2000_MS + days * DAY_MS)

/** Solve Kepler's equation M = E − e·sin E (radians) by Newton iteration. */
export function solveKepler(M: number, e: number) {
  let E = e < 0.8 ? M : Math.PI
  for (let k = 0; k < 8; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

export interface Vec3Like { x: number; y: number; z: number }

/**
 * Heliocentric position (AU) in scene axes: x/z span the ecliptic plane,
 * +y points to ecliptic north. Two-body Keplerian motion from J2000 elements.
 */
export function heliocentricAU(el: OrbitalElements, daysSinceJ2000: number, out: Vec3Like) {
  const n = 360 / el.periodDays
  const M = ((el.L - el.varpi + n * daysSinceJ2000) % 360) * DEG
  const E = solveKepler(M, el.e)
  return positionFromE(el, E, out)
}

export function positionFromE(el: OrbitalElements, E: number, out: Vec3Like) {
  const xp = el.a * (Math.cos(E) - el.e)
  const yp = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E)
  const w = (el.varpi - el.node) * DEG
  const O = el.node * DEG
  const I = el.i * DEG
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I)
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp
  const z = sw * sI * xp + cw * sI * yp
  // ecliptic (x, y, z-north) → scene (x, z-north as +y, −y)
  out.x = x
  out.y = z
  out.z = -y
  return out
}

/** Sample the full ellipse, evenly in eccentric anomaly. */
export function sampleOrbitAU(el: OrbitalElements, segments = 256) {
  const pts: Vec3Like[] = []
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * Math.PI * 2
    pts.push(positionFromE(el, E, { x: 0, y: 0, z: 0 }))
  }
  return pts
}

/** Orbital speed (km/s) from the vis-viva equation. */
export function visVivaKms(rAU: number, aAU: number) {
  const GM_SUN = 1.32712440018e11 // km^3/s^2
  return Math.sqrt(GM_SUN * (2 / (rAU * AU_KM) - 1 / (aAU * AU_KM)))
}
