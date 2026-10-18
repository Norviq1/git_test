import { useEffect, useState, type ReactNode } from 'react'
import { BODY_MAP, PLANET_IDS } from '@/data/bodies'
import { SIMULATION_NOTES, SOURCES } from '@/data/sources'
import { AU_KM, visVivaKms } from '@/lib/orbit'
import { fmt, fmtLightTime } from '@/lib/format'
import { useStore } from '@/store/useStore'
import { ScaleExplorer } from '@/ui/ScaleExplorer'

function Block({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/[0.06] py-12 first:border-0">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="hud !text-cyan-300/90">{kicker}</p>
          <h2 className="mt-2 font-display text-[26px] font-light leading-tight text-white">{title}</h2>
        </div>
        <div className="max-w-3xl space-y-4 text-[14.5px] leading-relaxed text-ink-200">{children}</div>
      </div>
    </section>
  )
}

function KeplerPlayground() {
  const [a, setA] = useState(1)
  const period = Math.pow(a, 1.5)
  const v = visVivaKms(a, a)
  return (
    <div className="glass rounded-2xl p-5">
      <p className="hud">Try Kepler’s third law</p>
      <div className="mt-3 flex items-center gap-3">
        <input type="range" min={0.3} max={40} step={0.1} value={a} onChange={(e) => setA(+e.target.value)} className="flex-1" aria-label="Orbital distance in AU" />
        <span className="w-20 text-right font-mono text-[13px] text-cyan-300">{fmt(a, 1)} AU</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div><p className="stat-label">Period</p><p className="stat-value mt-1">{period < 2 ? `${fmt(period * 365.25)} days` : `${fmt(period, 1)} years`}</p></div>
        <div><p className="stat-label">Speed (circular)</p><p className="stat-value mt-1">{fmt(v, 1)} km/s</p></div>
        <div><p className="stat-label">Sunlight</p><p className="stat-value mt-1">{fmt(100 / (a * a), a > 3 ? 2 : 0)}% of Earth’s</p></div>
      </div>
      <p className="mt-3 text-[11.5px] text-ink-500">P² = a³ with P in years and a in AU, for any small body orbiting the Sun.</p>
    </div>
  )
}

export default function Science() {
  const setCinematic = useStore((s) => s.setCinematic)
  const travelTo = useStore((s) => s.travelTo)
  useEffect(() => {
    document.title = 'About the Science — Heliora'
    if (useStore.getState().focusId) travelTo(null)
    setCinematic(true)
    return () => setCinematic(false)
  }, [setCinematic, travelTo])
  const planets = PLANET_IDS.map((id) => BODY_MAP[id])
  const earth = BODY_MAP.earth.orbit!

  return (
    <>
      <div className="page-scrim" />
      <main className="page z-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="max-w-2xl animate-fade-up">
            <p className="hud !text-cyan-300/90">About the science</p>
            <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-light leading-tight text-white">How the Solar System works.</h1>
            <nav className="mt-6 flex flex-wrap gap-1.5">
              {[['au', 'Distances'], ['orbits', 'Orbital mechanics'], ['formation', 'Formation'], ['system', 'The system at work'], ['scale', 'Scale explorer'], ['simulation', 'This simulation'], ['sources', 'Sources']].map(([id, l]) => (
                <a key={id} href={`#${id}`} className="chip">{l}</a>
              ))}
            </nav>
          </header>

          <Block id="au" kicker="01 · Distances" title="The astronomical unit">
            <p>
              Distances in the Solar System are measured in <strong className="text-white">astronomical units (AU)</strong>. One AU is defined as exactly 149,597,870.7 km — close to Earth’s average distance from the Sun. Light, the fastest thing in the universe, takes about 8 min 19 s to cross it.
            </p>
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-white/[0.06] text-left"><th className="stat-label px-4 py-2.5 font-normal">Planet</th><th className="stat-label px-4 py-2.5 font-normal">Mean distance</th><th className="stat-label px-4 py-2.5 font-normal">Sunlight takes</th></tr></thead>
                <tbody>
                  {planets.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-2"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: p.accent }} />{p.name}</td>
                      <td className="px-4 py-2 tabular-nums">{fmt(p.orbit!.a, 2)} AU</td>
                      <td className="px-4 py-2 tabular-nums">{fmtLightTime(p.orbit!.a * AU_KM).replace('light-', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Beyond the planets, the Kuiper Belt stretches to roughly 50 AU, and the hypothesised Oort Cloud may extend tens of thousands of AU — perhaps a quarter of the way to the nearest star.</p>
          </Block>

          <Block id="orbits" kicker="02 · Orbital mechanics" title="Falling around the Sun">
            <p>A planet is always falling toward the Sun, but it moves sideways fast enough that it keeps missing. Isaac Newton showed that the same gravity that drops an apple keeps the Moon in orbit; Johannes Kepler had already described the result in three laws:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li><span className="text-white">Orbits are ellipses</span> with the Sun at one focus. Most are nearly circular — Earth’s eccentricity is only {fmt(earth.e, 4)}.</li>
              <li><span className="text-white">Equal areas in equal times.</span> A planet speeds up near the Sun: Earth moves at about {fmt(visVivaKms(earth.a * (1 - earth.e), earth.a), 2)} km/s at perihelion in early January and {fmt(visVivaKms(earth.a * (1 + earth.e), earth.a), 2)} km/s at aphelion in early July.</li>
              <li><span className="text-white">The square of the period is proportional to the cube of the distance.</span> Check it with the real data below: a³ ÷ P² comes out at almost exactly 1 for every planet.</li>
            </ol>
            <div className="glass overflow-x-auto rounded-2xl">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-white/[0.06] text-left"><th className="stat-label px-4 py-2.5 font-normal">Planet</th><th className="stat-label px-4 py-2.5 font-normal">a (AU)</th><th className="stat-label px-4 py-2.5 font-normal">P (years)</th><th className="stat-label px-4 py-2.5 font-normal">a³ ÷ P²</th></tr></thead>
                <tbody>
                  {planets.map((p) => {
                    const P = p.orbit!.periodDays / 365.256
                    return (
                      <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2 tabular-nums">{fmt(p.orbit!.a, 3)}</td>
                        <td className="px-4 py-2 tabular-nums">{fmt(P, 3)}</td>
                        <td className="px-4 py-2 tabular-nums text-cyan-300">{fmt(Math.pow(p.orbit!.a, 3) / (P * P), 4)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <KeplerPlayground />
            <p>Seasons are caused by axial tilt, not distance: Earth is actually closest to the Sun during the northern winter.</p>
          </Block>

          <Block id="formation" kicker="03 · Formation" title="Born from a collapsing cloud">
            <p>About 4.6 billion years ago, part of a cold cloud of gas and dust collapsed under its own gravity — possibly triggered by a nearby supernova. Most of the material fell to the centre to form the Sun; the rest flattened into a spinning <span className="text-white">protoplanetary disk</span>. That is why the planets orbit in nearly the same plane and the same direction.</p>
            <p>Close to the young Sun, only rock and metal could stay solid, so the inner planets are small and rocky. Beyond the <span className="text-white">frost line</span>, around the present-day asteroid belt, water and other ices also condensed. Solid cores grew large enough there to capture hydrogen and helium gas, forming the giants.</p>
            <p>Dust grains stuck together into pebbles, then kilometre-sized planetesimals, then planetary embryos that collided. A giant impact on the young Earth is the leading explanation for the Moon’s origin.</p>
            <p className="rounded-xl border border-flare-400/20 bg-flare-400/[0.04] p-4 text-[13.5px]"><span className="text-flare-300">Open questions.</span> Models such as the “Nice model” and “Grand Tack” propose that the giant planets migrated after forming, scattering small bodies and shaping the asteroid and Kuiper belts. These are well-supported hypotheses, but the details are still debated.</p>
          </Block>

          <Block id="system" kicker="04 · The system at work" title="Gravity, light and resonance">
            <p><span className="text-white">The Sun</span> holds 99.86% of the Solar System’s mass and supplies nearly all of its energy. Its solar wind blows outward to form the heliosphere, a bubble that Voyager 1 left in 2012 and Voyager 2 in 2018.</p>
            <p><span className="text-white">Resonances</span> organise the system. Pluto orbits the Sun twice for every three orbits of Neptune, which keeps them from ever colliding. Io, Europa and Ganymede are locked in a 1:2:4 rhythm that flexes Io and heats its interior. Jupiter’s resonances cleared the <span className="text-white">Kirkwood gaps</span> in the asteroid belt — you can see them in the explorer’s belt particles.</p>
            <p><span className="text-white">Tides</span> lock many moons so that one face always points to their planet, and they slowly push our Moon away from Earth by about 3.8 cm per year.</p>
            <p><span className="text-white">Trojans</span> share Jupiter’s orbit, clustered about 60° ahead of and behind the planet at its stable Lagrange points. NASA’s Lucy mission is on its way to visit them.</p>
          </Block>

          <section id="scale" className="scroll-mt-24 border-t border-white/[0.06] py-12">
            <ScaleExplorer />
          </section>

          <Block id="simulation" kicker="05 · This simulation" title="What is real, what is approximate">
            <p>Every measurement in this site comes from the sources below. The visuals make trade-offs so the system can be explored on a screen; here is each one, stated plainly.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SIMULATION_NOTES.map((n) => (
                <div key={n.title} className="glass rounded-2xl p-4">
                  <p className="text-[14px] text-white">{n.title}</p>
                  <p className="mt-1.5 text-[13px] text-ink-400">{n.body}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block id="sources" kicker="06 · Sources" title="Where the numbers come from">
            <ul className="space-y-3">
              {SOURCES.map((s) => (
                <li key={s.url} className="glass rounded-2xl p-4">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-[14px] text-cyan-300 hover:underline">{s.title}</a>
                  <p className="text-[12px] text-ink-400">{s.publisher}</p>
                  <p className="mt-1.5 text-[13px]">{s.usedFor}</p>
                </li>
              ))}
            </ul>
            <p className="text-[12.5px] text-ink-400">Moon counts change as new discoveries are confirmed; values here reflect published totals as of 2025.</p>
          </Block>
        </div>
      </main>
    </>
  )
}
