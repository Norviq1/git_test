import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BODIES, BODY_MAP } from '@/data/bodies'
import type { Body } from '@/data/types'
import { fmt } from '@/lib/format'
import { useStore } from '@/store/useStore'

export function Orb({ body, size = 56 }: { body: Body; size?: number }) {
  return (
    <span
      className="block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, ${body.accent}ff 0%, ${body.accent}aa 35%, #0b0e15 78%)`,
        boxShadow: body.kind === 'star' ? `0 0 ${size / 2}px ${body.accent}88` : `inset -${size / 6}px -${size / 8}px ${size / 4}px rgba(0,0,0,0.6)`,
      }}
      aria-hidden
    />
  )
}

function Card({ body }: { body: Body }) {
  return (
    <Link to={`/encyclopedia/${body.id}`} className="glass group flex flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-start justify-between">
        <Orb body={body} />
        <span className="hud">{body.parent ? BODY_MAP[body.parent].name : body.orbit ? `${fmt(body.orbit.a, 2)} AU` : 'Centre'}</span>
      </div>
      <h3 className="mt-5 font-display text-[22px] font-light text-white">{body.name}</h3>
      <p className="mt-0.5 text-[12px] text-ink-400">{body.classification}</p>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-200">{body.tagline}</p>
      <div className="mt-4 flex gap-4 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-ink-400">
        <span>⌀ {fmt(body.radiusKm * 2)} km</span>
        <span>g {fmt(body.gravity, body.gravity < 1 ? 2 : 1)}</span>
        {body.moons.count !== null && body.kind !== 'moon' && <span>{body.moons.count} moons</span>}
      </div>
    </Link>
  )
}

export default function Encyclopedia() {
  const setCinematic = useStore((s) => s.setCinematic)
  const travelTo = useStore((s) => s.travelTo)
  useEffect(() => {
    document.title = 'Planet Encyclopedia — Heliora'
    if (useStore.getState().focusId) travelTo(null)
    setCinematic(true)
    return () => setCinematic(false)
  }, [setCinematic, travelTo])
  const groups: [string, string, Body[]][] = [
    ['The Sun & planets', 'In order from the Sun.', BODIES.filter((b) => b.kind === 'star' || b.kind === 'planet')],
    ['Dwarf planets', 'Large enough to be round, but they have not cleared their orbits.', BODIES.filter((b) => b.kind === 'dwarf')],
    ['Major moons', 'Some are bigger than planets — and a few may hide oceans.', BODIES.filter((b) => b.kind === 'moon')],
  ]
  return (
    <>
      <div className="page-scrim" />
      <main className="page z-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <header className="max-w-2xl animate-fade-up">
            <p className="hud !text-cyan-300/90">Planet encyclopedia</p>
            <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-light leading-tight text-white">Every world, in detail.</h1>
            <p className="mt-3 text-[15px] text-ink-200">Physical data from NASA fact sheets, mission results and clearly separated evidence and hypotheses. Open a world to fly the camera to it.</p>
          </header>
          {groups.map(([title, sub, list]) => (
            <section key={title} className="mt-12">
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
                <h2 className="font-display text-[18px] text-ink-50">{title}</h2>
                <p className="hidden text-[13px] text-ink-400 sm:block">{sub}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((b) => (
                  <Card key={b.id} body={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  )
}
