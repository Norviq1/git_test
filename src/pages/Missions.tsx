import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MILESTONES } from '@/data/missions'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'

const STATUS = { past: 'Completed', active: 'Active', planned: 'Planned', 'en-route': 'En route' } as const

export default function Missions() {
  const setCinematic = useStore((s) => s.setCinematic)
  const travelTo = useStore((s) => s.travelTo)
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    document.title = 'Missions & Discoveries — Heliora'
    if (useStore.getState().focusId) travelTo(null)
    setCinematic(true)
    return () => setCinematic(false)
  }, [setCinematic, travelTo])

  const timeline = useMemo(() => [...MILESTONES].sort((a, b) => a.year - b.year), [])
  const shown = filter === 'all' ? timeline : timeline.filter((m) => m.targetId && (m.targetId === filter || BODY_MAP[m.targetId]?.parent === filter))
  const current = BODIES.flatMap((b) => b.missions.filter((m) => m.status === 'active' || m.status === 'en-route' || m.status === 'planned').map((m) => ({ ...m, body: b })))

  const targets = ['all', 'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'pluto']
  return (
    <>
      <div className="page-scrim" />
      <main className="page z-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="max-w-2xl animate-fade-up">
            <p className="hud !text-cyan-300/90">Missions & discoveries</p>
            <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-light leading-tight text-white">Seven decades of exploration.</h1>
            <p className="mt-3 text-[15px] text-ink-200">Every planet has now been visited by at least one spacecraft. Here is what we sent — and what each mission taught us.</p>
          </header>

          <div className="mt-8 flex flex-wrap gap-1.5">
            {targets.map((t) => (
              <button key={t} className="chip" data-on={filter === t} onClick={() => setFilter(t)}>
                {t === 'all' ? 'All' : BODY_MAP[t].name}
              </button>
            ))}
          </div>

          <ol className="relative mt-8 border-l border-white/10 pl-6 sm:pl-10">
            {shown.map((m) => (
              <li key={m.name + m.year} className="relative mb-6 animate-fade-up">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-400/70 bg-void sm:-left-[45px]" />
                <div className="glass rounded-2xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-[12px] text-cyan-300">{m.year}</p>
                    <p className="hud">{m.agency} · {m.target}</p>
                  </div>
                  <h3 className="mt-1.5 font-display text-[20px] font-light text-white">{m.name}</h3>
                  <p className="mt-1 text-[13.5px] text-ink-200">{m.summary}</p>
                  <p className="mt-2 text-[13.5px] text-ink-400"><span className="text-ink-200">What we learned: </span>{m.learned}</p>
                  {m.targetId && (
                    <Link to={`/explore/${m.targetId}`} className="mt-3 inline-block text-[12px] text-cyan-300 hover:underline">Fly to {BODY_MAP[m.targetId].name} →</Link>
                  )}
                </div>
              </li>
            ))}
            {shown.length === 0 && <li className="text-ink-400">No landmark missions in this list for that target — see its encyclopedia page.</li>}
          </ol>

          <section className="mt-14">
            <h2 className="font-display text-[22px] font-light text-white">Active, en route & planned</h2>
            <p className="mt-1 text-[13px] text-ink-400">Status as of 2025–2026; launch dates for planned missions can slip.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((m) => (
                <div key={m.name + m.body.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="hud" style={{ color: m.body.accent }}>{m.body.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] ${m.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : m.status === 'en-route' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-flare-400/10 text-flare-300'}`}>
                      {STATUS[m.status!]}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] text-white">{m.name}</p>
                  <p className="text-[12px] text-ink-400">{m.agency} · {m.years}</p>
                  <p className="mt-2 text-[13px] text-ink-200">{m.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
