# Heliora — Interactive 3D Solar System Explorer

An immersive, scientifically grounded 3D explorer of the Solar System, built with
React, TypeScript, Vite, Three.js, React Three Fiber, Drei and Tailwind CSS.

Planet positions are computed for **today's date** from NASA JPL orbital elements.
Every physical number comes from a cited source, and every visual shortcut is
labelled in the UI.

## Run it locally

Requirements: Node.js 18+ (20 or 22 recommended) and a WebGL 2-capable browser.

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # type-checks, then builds into dist/
npm run preview    # serves dist/ at http://localhost:4173
```

The app uses client-side routing (`/explore/mars`, `/encyclopedia/titan`, …). When
deploying `dist/` to a static host, configure an SPA fallback to `index.html`.

## What's inside

| Section | Route | What it does |
| --- | --- | --- |
| Launch | `/` | Cinematic, slowly orbiting view of the live Solar System with an immediate “Launch explorer” button. |
| Explorer | `/explore`, `/explore/:id` | Full-screen 3D simulation: click or tap any body to fly to it, info panel with expandable sections, time controls, travel menu, orbit inspector, labels, scale modes. |
| Encyclopedia | `/encyclopedia`, `/encyclopedia/:id` | Cards for the Sun, planets, dwarf planets and 11 major moons; detail pages fly the background camera to the object. |
| Compare | `/compare?a=earth&b=jupiter` | Any two bodies at true relative size, an 11-metric comparison table and plain-language summaries, plus the Scale Explorer. |
| Missions | `/missions` | Filterable timeline of landmark missions and what each taught us, plus active/en-route/planned missions. |
| Science | `/science` | Astronomical units and light-time, Kepler’s laws checked against real data (with an interactive calculator), formation, resonances, scale explorer, simulation assumptions and sources. |

### Explorer features

- **Sun, 8 planets, Ceres, Pluto and 11 moons** (Moon, Phobos, Deimos, Io, Europa, Ganymede, Callisto, Titan, Enceladus, Titania, Triton).
- **Real orbits**: two-body Keplerian ellipses from JPL J2000 elements (eccentricity, inclination, node, perihelion), solved every frame; positions start at the current date.
- **Asteroid belt with Kirkwood gaps, Jupiter Trojans at L4/L5, and the Kuiper Belt** — ~13,000 GPU-animated particles following Kepler’s third law.
- **Rendering**: animated HDR Sun with granulation, sunspots, limb darkening, corona streamers and flare loops; bloom; Saturn’s rings with the Cassini Division, Encke gap and the planet’s shadow; faint Uranus, Neptune and Jupiter rings; atmospheric scattering halos; Earth with normal map, glossy oceans, clouds and night-side city lights; real axial tilts (Uranus on its side, Venus upside down).
- **Camera**: drag to orbit, scroll/pinch to zoom, click/tap to travel along a cinematic arc that pulls back for long journeys, then follows the moving body. “Overview” resets.
- **Two scale modes**: *Explore* (sizes ∝ radius^0.45, distances compressed — clearly labelled) and *True scale* (sizes and distances share one scale: 1 AU = 1,000 units).
- **Time simulator**: real-time up to 10 years per second, pause, reverse, jump to now; live UTC date.
- **Travel mode**: destination picker; the HUD shows the real distance and light-travel time of the journey.
- **Orbit inspector**: live distance, speed (vis-viva), light-time, perihelion/aphelion and a to-scale orbit diagram.
- **Labels** with optional live data (distance from Sun, orbital speed); moon labels appear when you are near their planet and hide behind it.
- **Fact discovery** toast on arrival; **search** palette (`/` or `⌘K`/`Ctrl+K`) for bodies and regions.
- **Mobile**: touch gestures, bottom-sheet info panel, horizontal object strip, compact controls.
- **Robustness**: loading veil, adaptive quality (auto-drops to “Performance” on slow devices; manual toggle in the layers menu), adaptive DPR, dynamic near plane with a logarithmic depth buffer, WebGL 2 detection and a graceful fallback that keeps the encyclopedia, comparisons and science pages usable.

## Accuracy and assumptions

All scientific values live in `src/data/` and are drawn from the NASA NSSDCA
Planetary Fact Sheets, JPL Solar System Dynamics, NASA Science, ESA and the IAU
Minor Planet Center (see `src/data/sources.ts` and the Science page).

Stated simplifications (also shown in the app):

- Orbits ignore planetary perturbations and the slow drift of elements; positions are approximate (typically within a degree or two for recent decades).
- Moons use circular orbits in their planet’s equatorial plane with illustrative starting phases. Ceres’ starting phase is approximate.
- At high simulation speeds, axial rotation and moon motion are capped so they don’t strobe; rotational phase is illustrative.
- Sunlight does not dim with distance in the scene.
- **Textures**: Earth (colour, normal, specular, clouds, city lights) and Moon maps come from the three.js example assets (MIT), which are derived from NASA imagery. **Every other surface is procedurally generated on the GPU** (`src/three/shaders/surface.ts`) as an artistic approximation informed by spacecraft imagery — not real surface maps. The starfield, Milky Way/nebula backdrop and the Sun’s animation are also artistic.
- Moon counts reflect published totals as of 2025 and change frequently.

## Project structure

```
src/
  data/        bodies.ts (central astronomical data), missions.ts, sources.ts, types.ts
  lib/         orbit.ts (Kepler solver, vis-viva), scale.ts (scale modes), format.ts
  store/       useStore.ts (UI state, zustand), sim.ts (non-reactive clock + live positions)
  three/       Scene, SolarSystem, SystemClock, Body, Sun, Rings, Atmosphere, Belt, Sky,
               OrbitLines, CameraRig, Labels, bake.ts + recipes.ts (procedural surfaces), shaders/
  ui/          TopNav, SearchPalette, BodyDetails, ScaleExplorer, LoadingVeil, Fallback, explorer/*
  pages/       Home, Explorer, Encyclopedia, BodyPage, Compare, Missions, Science
public/textures/  Earth & Moon maps
```

The render loop never triggers React re-renders: simulated time and positions are
mutable module state (`store/sim.ts`) computed once per frame by `SystemClock` and
read by the bodies, camera rig and labels.

## Known limitations / next steps

- Swap the procedural surfaces for real global mosaics (e.g. NASA/USGS maps, or Solar System Scope textures under CC BY 4.0) for Mercury, Venus (radar), Mars, Jupiter, Saturn and the moons — `RECIPES` in `src/three/recipes.ts` already supports a `textures` entry.
- Use full JPL rates (or VSOP87/an ephemeris) for higher positional accuracy over centuries, and real moon ephemerides.
- No eclipses/moon shadows or ring shadows on Saturn’s globe yet.
- More moons (Miranda, Oberon, Charon, Mimas, …) and comets would be natural additions; each needs only a data entry and a recipe.
- Add automated tests (unit tests for `lib/orbit.ts`, Playwright smoke tests for the routes).
