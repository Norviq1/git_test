export interface Source {
  title: string
  publisher: string
  url: string
  usedFor: string
}

export const SOURCES: Source[] = [
  {
    title: 'Planetary Fact Sheets',
    publisher: 'NASA Space Science Data Coordinated Archive (NSSDCA)',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    usedFor: 'Diameters, masses, gravity, density, rotation, day length, temperatures, pressures, atmospheric composition.',
  },
  {
    title: 'Approximate Positions of the Planets',
    publisher: 'NASA JPL Solar System Dynamics',
    url: 'https://ssd.jpl.nasa.gov/planets/approx_pos.html',
    usedFor: 'J2000 Keplerian orbital elements used to place the planets and Pluto.',
  },
  {
    title: 'Planetary Satellite Physical Parameters & Mean Elements',
    publisher: 'NASA JPL Solar System Dynamics',
    url: 'https://ssd.jpl.nasa.gov/sats/',
    usedFor: 'Moon radii, orbital distances and periods.',
  },
  {
    title: 'NASA Science — Solar System',
    publisher: 'NASA',
    url: 'https://science.nasa.gov/solar-system/',
    usedFor: 'Mission histories, moon counts, surface features and habitability context.',
  },
  {
    title: 'Natural Satellites Ephemeris Service & announcements',
    publisher: 'IAU Minor Planet Center',
    url: 'https://minorplanetcenter.net/',
    usedFor: 'Moon discovery announcements (counts change frequently).',
  },
  {
    title: 'ESA Science & Exploration',
    publisher: 'European Space Agency',
    url: 'https://www.esa.int/Science_Exploration',
    usedFor: 'BepiColombo, JUICE, Solar Orbiter, Venus Express and Huygens mission information.',
  },
  {
    title: 'three.js example textures (Earth, clouds, city lights, Moon)',
    publisher: 'three.js project (MIT licence)',
    url: 'https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets',
    usedFor: 'Earth and Moon surface maps — derived from NASA imagery. All other surfaces are procedurally generated.',
  },
]

/** Plain-language list of every simplification the simulation makes. */
export const SIMULATION_NOTES: { title: string; body: string }[] = [
  {
    title: 'Orbits',
    body: 'Planets and Pluto follow two-body Keplerian ellipses using JPL J2000 elements. Perturbations between planets and the slow drift of orbital elements are ignored, so positions are approximate (typically within a degree or two for recent decades).',
  },
  {
    title: 'Moons',
    body: 'Moons move on circular orbits in their parent’s equatorial plane using real mean distances and periods. Their starting positions are illustrative, not ephemeris-accurate.',
  },
  {
    title: 'Rotation',
    body: 'Planets spin at their real sidereal rates at slow simulation speeds. At high speeds, rotation and moon motion are capped so they remain visible instead of strobing. The rotational phase (which longitude faces the Sun) is illustrative.',
  },
  {
    title: 'Explore scale',
    body: 'In Explore mode, distances are compressed with a power law and planet sizes are enlarged (size ∝ radius^0.45) so every world is visible at once. Moon distances are also compressed. Relative order is preserved.',
  },
  {
    title: 'True scale',
    body: 'In True Scale mode, sizes and distances share one scale: 1 AU = 1,000 scene units and every radius uses that same factor. Planets become invisible specks from afar, which is the honest picture — use the labels to find them. Belt particles stay enlarged so they remain visible.',
  },
  {
    title: 'Lighting',
    body: 'Sunlight does not dim with distance in this scene; real sunlight at Neptune is about 900 times fainter than at Earth. Bloom and glare are cinematic effects.',
  },
  {
    title: 'Surfaces & sky',
    body: 'Earth and Moon use maps derived from NASA imagery. Every other surface, the Sun’s animation, the starfield and the faint Milky Way/nebula backdrop are procedural artistic renderings, not observations.',
  },
  {
    title: 'Belts',
    body: 'The asteroid and Kuiper belts are representative particle fields. The real main belt contains over a million asteroids larger than 1 km, spread so thinly that spacecraft cross it without danger.',
  },
]
