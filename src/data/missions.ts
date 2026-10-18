export interface Milestone {
  year: number
  name: string
  agency: string
  target: string
  /** body id for "fly there" links */
  targetId?: string
  summary: string
  learned: string
}

/** Landmark missions, ordered by launch year. */
export const MILESTONES: Milestone[] = [
  { year: 1957, name: 'Sputnik 1', agency: 'USSR', target: 'Earth orbit', targetId: 'earth', summary: 'First artificial satellite.', learned: 'Opened the space age; its radio signals revealed information about the upper atmosphere.' },
  { year: 1959, name: 'Luna 3', agency: 'USSR', target: 'Moon', targetId: 'moon', summary: 'First images of the lunar far side.', learned: 'The far side has far fewer dark maria than the near side.' },
  { year: 1962, name: 'Mariner 2', agency: 'NASA', target: 'Venus', targetId: 'venus', summary: 'First successful planetary flyby.', learned: 'Venus’s surface is extremely hot; confirmed the solar wind exists.' },
  { year: 1964, name: 'Mariner 4', agency: 'NASA', target: 'Mars', targetId: 'mars', summary: 'First close-up images of Mars.', learned: 'A cratered, Moon-like surface with a very thin atmosphere.' },
  { year: 1969, name: 'Apollo 11', agency: 'NASA', target: 'Moon', targetId: 'moon', summary: 'First humans to walk on another world.', learned: 'Returned lunar samples that support the giant-impact origin of the Moon.' },
  { year: 1970, name: 'Venera 7', agency: 'USSR', target: 'Venus', targetId: 'venus', summary: 'First data from the surface of another planet.', learned: 'Surface temperature of about 475 °C and crushing pressure.' },
  { year: 1975, name: 'Viking 1 & 2', agency: 'NASA', target: 'Mars', targetId: 'mars', summary: 'First long-lived Mars landers.', learned: 'Detailed surface chemistry; life-detection results were ambiguous and are generally interpreted as non-biological.' },
  { year: 1977, name: 'Voyager 1 & 2', agency: 'NASA', target: 'Outer planets', targetId: 'jupiter', summary: 'Grand tour of the giant planets; Voyager 2 is the only visitor to Uranus and Neptune.', learned: 'Volcanoes on Io, ring structures, Triton’s geysers — and both are now in interstellar space.' },
  { year: 1990, name: 'Hubble Space Telescope', agency: 'NASA / ESA', target: 'Universe', summary: 'Long-lived space observatory.', learned: 'Watched comet Shoemaker–Levy 9 hit Jupiter in 1994, and tracks storms across the planets.' },
  { year: 1989, name: 'Galileo', agency: 'NASA', target: 'Jupiter', targetId: 'jupiter', summary: 'First Jupiter orbiter and atmospheric probe.', learned: 'Strong evidence of a salty ocean beneath Europa’s ice.' },
  { year: 1997, name: 'Cassini–Huygens', agency: 'NASA / ESA / ASI', target: 'Saturn', targetId: 'saturn', summary: '13 years orbiting Saturn; Huygens landed on Titan in 2005.', learned: 'Methane lakes on Titan, plumes and an ocean on Enceladus.' },
  { year: 2003, name: 'Spirit & Opportunity', agency: 'NASA', target: 'Mars', targetId: 'mars', summary: 'Twin rovers; Opportunity drove over 45 km.', learned: 'Minerals proving liquid water once soaked the Martian surface.' },
  { year: 2006, name: 'New Horizons', agency: 'NASA', target: 'Pluto', targetId: 'pluto', summary: 'First flyby of Pluto (2015) and Arrokoth (2019).', learned: 'Pluto is geologically active, with nitrogen glaciers and haze.' },
  { year: 2004, name: 'MESSENGER', agency: 'NASA', target: 'Mercury', targetId: 'mercury', summary: 'First Mercury orbiter.', learned: 'Water ice in polar craters and a surprisingly volatile-rich crust.' },
  { year: 2011, name: 'Juno', agency: 'NASA', target: 'Jupiter', targetId: 'jupiter', summary: 'Polar orbiter since 2016.', learned: 'Clusters of polar cyclones and a diluted, “fuzzy” core.' },
  { year: 2011, name: 'Curiosity', agency: 'NASA', target: 'Mars', targetId: 'mars', summary: 'Car-sized rover in Gale crater.', learned: 'Gale crater held a lake that could have supported microbial life.' },
  { year: 2018, name: 'Parker Solar Probe', agency: 'NASA', target: 'Sun', targetId: 'sun', summary: 'Closest-ever approach to the Sun.', learned: 'Magnetic “switchbacks” in the young solar wind.' },
  { year: 2018, name: 'Chang’e 4', agency: 'CNSA', target: 'Moon', targetId: 'moon', summary: 'First soft landing on the lunar far side.', learned: 'Subsurface layering of the far-side South Pole–Aitken basin.' },
  { year: 2020, name: 'Perseverance & Ingenuity', agency: 'NASA', target: 'Mars', targetId: 'mars', summary: 'Sample-caching rover and the first planetary helicopter.', learned: 'Jezero crater’s ancient delta; rocks with potential biosignature features under study.' },
  { year: 2021, name: 'James Webb Space Telescope', agency: 'NASA / ESA / CSA', target: 'Universe', summary: 'Infrared observatory at Sun–Earth L2.', learned: 'Sharp infrared views of the giant planets’ rings and new moons.' },
  { year: 2023, name: 'JUICE', agency: 'ESA', target: 'Jupiter', targetId: 'ganymede', summary: 'En route to orbit Ganymede.', learned: 'Arrives in 2031.' },
  { year: 2024, name: 'Europa Clipper', agency: 'NASA', target: 'Europa', targetId: 'europa', summary: 'En route to Jupiter.', learned: 'Arrives in 2030 to assess Europa’s habitability.' },
]
