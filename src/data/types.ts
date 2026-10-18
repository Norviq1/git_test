export type BodyKind = 'star' | 'planet' | 'dwarf' | 'moon'

/** Keplerian elements referenced to the mean ecliptic and equinox of J2000 (JPL Table 1). */
export interface OrbitalElements {
  /** Semi-major axis, AU */
  a: number
  /** Eccentricity */
  e: number
  /** Inclination to the ecliptic, degrees */
  i: number
  /** Mean longitude at J2000, degrees */
  L: number
  /** Longitude of perihelion, degrees */
  varpi: number
  /** Longitude of the ascending node, degrees */
  node: number
  /** Sidereal orbital period, Earth days */
  periodDays: number
  /** Mean orbital velocity, km/s */
  meanVelocityKms: number
  /** true when the starting phase is approximate rather than taken from JPL elements */
  phaseApprox?: boolean
}

/** Simplified circular orbit used for moons. */
export interface MoonOrbit {
  /** Mean distance from the parent's centre, km */
  distanceKm: number
  /** Sidereal orbital period, days */
  periodDays: number
  retrograde?: boolean
  /** Inclination to the parent's equator, degrees (display only) */
  inclination?: number
}

export interface GasShare {
  gas: string
  /** percentage by volume unless the composition note says otherwise */
  pct?: number
  note?: string
}

export interface Mission {
  name: string
  agency: string
  years: string
  type: string
  note: string
  status?: 'past' | 'active' | 'planned' | 'en-route'
}

export interface Body {
  id: string
  name: string
  kind: BodyKind
  classification: string
  parent?: string
  /** UI accent colour */
  accent: string
  tagline: string
  intro: string

  radiusKm: number
  /** km, used for oblate gas giants (equatorial) */
  equatorialRadiusKm?: number
  massKg: number
  /** relative to Earth = 1 */
  massEarths: number
  gravity: number
  escapeVelocity?: number
  densityGcm3?: number

  /** Sidereal rotation period in hours. Negative = retrograde. */
  rotationHours: number
  /** Mean solar day in hours (planets) */
  dayLengthHours?: number
  /** Obliquity to orbit, degrees */
  axialTilt: number

  temperature: {
    /** mean or representative temperature, °C */
    meanC?: number
    /** description of what the mean represents */
    meanNote: string
    /** local / range information */
    range: string
  }
  surfacePressure?: string

  orbit?: OrbitalElements
  moonOrbit?: MoonOrbit

  atmosphere: {
    summary: string
    composition: GasShare[]
    compositionNote?: string
  }
  surface: string
  geology: string[]
  moons: { count: number | null; note: string; notable?: string[] }
  rings: string
  magneticField: string
  phenomena: string[]
  missions: Mission[]
  facts: string[]
  habitability: { verdict: string; evidence: string[]; speculation: string[] }
}
