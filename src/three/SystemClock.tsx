import { useFrame } from '@react-three/fiber'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { heliocentricAU } from '@/lib/orbit'
import { moonDistanceScale, radiusScale, scaleVector } from '@/lib/scale'
import { helioAU, positions, sceneRadius, sim } from '@/store/sim'
import { useStore } from '@/store/useStore'

/** Rotation (radians) of each body about its own axis. Integrated with a cap. */
export const spin: Record<string, number> = {}
/** Orbital angle (radians) of each moon. Integrated with a cap. */
export const moonAngle: Record<string, number> = {}

const MAX_SPIN = Math.PI * 2 * 0.35 // rev/s cap for axial rotation
const MAX_MOON = Math.PI * 2 * 0.12 // rev/s cap for moon orbits

BODIES.forEach((b, i) => {
  spin[b.id] = i * 1.7
  if (b.moonOrbit) moonAngle[b.id] = (i * 2.399) % (Math.PI * 2) // golden-angle spread: illustrative phases
})

const helio = BODIES.filter((b) => b.orbit)
const moons = BODIES.filter((b) => b.moonOrbit)
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))

/** Advances simulated time and computes every body's position, once per frame. */
export function SystemClock() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const mode = useStore.getState().scaleMode
    const dDays = sim.paused ? 0 : sim.speed * dt
    sim.days += dDays
    // keep within the range where J2000 elements remain meaningful
    if (sim.days > 36525 * 1.5) sim.days = 36525 * 1.5
    if (sim.days < -36525 * 1.5) sim.days = -36525 * 1.5

    for (const b of BODIES) {
      sceneRadius[b.id] = radiusScale(b, mode)
      if (b.rotationHours) {
        // obliquity > 90° already encodes retrograde spin, so use the magnitude there
        const period = b.axialTilt > 90 ? Math.abs(b.rotationHours) : b.rotationHours
        const rate = (dDays * 24 * Math.PI * 2) / period
        spin[b.id] += clamp(rate, MAX_SPIN * dt)
      }
    }
    positions.sun.set(0, 0, 0)
    for (const b of helio) {
      const v = heliocentricAU(b.orbit!, sim.days, helioAU[b.id])
      positions[b.id].set(v.x, v.y, v.z)
      scaleVector(positions[b.id], mode)
    }
    for (const m of moons) {
      const parent = BODY_MAP[m.parent!]
      const o = m.moonOrbit!
      const sign = o.retrograde ? -1 : 1
      const rate = (dDays * Math.PI * 2) / o.periodDays
      moonAngle[m.id] += sign * clamp(rate, MAX_MOON * dt)
      const r = moonDistanceScale(m, parent, mode)
      const a = moonAngle[m.id]
      // circular orbit in the parent's equatorial plane (the parent is tilted about the scene z axis)
      const tilt = (parent.axialTilt * Math.PI) / 180
      const x = Math.cos(a) * r
      const z = -Math.sin(a) * r
      const pp = positions[parent.id]
      positions[m.id].set(pp.x + x * Math.cos(tilt), pp.y + x * Math.sin(tilt), pp.z + z)
      helioAU[m.id].copy(helioAU[parent.id])
    }
  }, -3)
  return null
}
