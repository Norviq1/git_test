import type { Body } from '@/data/types'
import { AU_KM } from './orbit'

export type ScaleMode = 'explore' | 'true'

/** True-scale: 1 AU = 1000 scene units; radii use the same factor. */
export const TRUE_AU = 1000
const TRUE_KM = TRUE_AU / AU_KM

const EARTH_R = 6371
export const SUN_EXPLORE_RADIUS = 6.2

/** Radial distance mapping from AU to scene units. */
export function distanceScale(rAU: number, mode: ScaleMode) {
  if (mode === 'true') return rAU * TRUE_AU
  return 10 + 26 * Math.pow(rAU, 0.62)
}

/** Radius of a body in scene units. */
export function radiusScale(body: Body, mode: ScaleMode) {
  const r = body.equatorialRadiusKm ?? body.radiusKm
  if (mode === 'true') return r * TRUE_KM
  if (body.kind === 'star') return SUN_EXPLORE_RADIUS
  const v = 0.9 * Math.pow(r / EARTH_R, 0.45)
  return Math.max(v, body.kind === 'moon' ? 0.09 : 0.18)
}

/** Distance of a moon from its parent's centre, in scene units. */
export function moonDistanceScale(moon: Body, parent: Body, mode: ScaleMode) {
  const dKm = moon.moonOrbit!.distanceKm
  if (mode === 'true') return dKm * TRUE_KM
  const pr = radiusScale(parent, mode)
  const ratio = dKm / (parent.equatorialRadiusKm ?? parent.radiusKm)
  // Earth's Moon is unusually far out for its planet; tighten it so it doesn't cross Venus's or Mars's orbit
  const k = parent.id === 'earth' ? 0.78 : 1
  return (pr * (1.35 + 0.62 * Math.pow(ratio, 0.42)) + radiusScale(moon, mode) * 1.5) * k
}

/** Map a heliocentric AU vector into scene units (in place), preserving direction. */
export function scaleVector(v: { x: number; y: number; z: number }, mode: ScaleMode) {
  const r = Math.hypot(v.x, v.y, v.z)
  if (r === 0) return v
  const k = distanceScale(r, mode) / r
  v.x *= k
  v.y *= k
  v.z *= k
  return v
}

export const kmToScene = (km: number, mode: ScaleMode, ref?: Body) => {
  if (mode === 'true') return km * TRUE_KM
  // in explore mode, a km length near a body is expressed relative to its visual radius
  if (ref) return (km / (ref.equatorialRadiusKm ?? ref.radiusKm)) * radiusScale(ref, mode)
  return km / EARTH_R
}
