import { Vector3 } from 'three'
import { BODIES } from '@/data/bodies'
import { dateToDays } from '@/lib/orbit'

/**
 * Mutable, non-reactive simulation state. Read and written inside the render
 * loop so the clock never triggers React re-renders.
 */
export const sim = {
  /** simulated time, days since J2000.0 */
  days: dateToDays(new Date()),
  /** simulated days per real second (negative runs backwards) */
  speed: 2,
  paused: false,
}

/** Live scene-space positions of every body, refreshed each frame by SystemClock. */
export const positions: Record<string, Vector3> = Object.fromEntries(BODIES.map((b) => [b.id, new Vector3()]))

/** Live heliocentric positions in AU (planets / dwarf planets only). */
export const helioAU: Record<string, Vector3> = Object.fromEntries(BODIES.map((b) => [b.id, new Vector3()]))

/** Scene radius currently used for each body. */
export const sceneRadius: Record<string, number> = {}
