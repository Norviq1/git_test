import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BODIES, BODY_MAP } from '@/data/bodies'
import type { Body } from '@/data/types'
import { fmt, fmtDuration, fmtPeriodDays, fmtRatio, fmtSci } from '@/lib/format'
import { useStore } from '@/store/useStore'
import { ScaleExplorer } from '@/ui/ScaleExplorer'

interface Metric {
  label: string
  get: (b: Body) => number | undefined
  show: (v: number) => string
  ratio?: 'ratio' | 'diff'
  noun?: [string, string]
}

const helioDistance = (b: Body) => (b.orbit ? b.orbit.a : b.parent ? BODY_MAP[b.parent].orbit?.a : undefined)

const METRICS: Metric[] = [
  { label: 'Diameter', get: (b) => b.radiusKm * 2, show: (v) => `${fmt(v)} km`, ratio: 'ratio', noun: ['wider', 'narrower'] },
  { label: 'Mass', get: (b) => b.massKg, show: (v) => fmtSci(v, ' kg'), ratio: 'ratio', noun: ['more massive', 'less massive'] },
  { label: 'Surface gravity', get: (b) => b.gravity, show: (v) => `${fmt(v, v < 1 ? 3 : 1)} m/s²`, ratio: 'ratio', noun: ['stronger', 'weaker'] },
  { label: 'Mean density', get: (b) => b.densityGcm3, show: (v) => `${fmt(v, 2)} g/cm³`, ratio: 'ratio', noun: ['denser', 'less dense'] },
  { label: 'Escape velocity', get: (b) => b.escapeVelocity, show: (v) => `${fmt(v, 1)} km/s`, ratio: 'ratio', noun: ['higher', 'lower'] },
  { label: 'Mean temperature', get: (b) => b.temperature.meanC, show: (v) => `${fmt(v)} °C`, ratio: 'diff' },
  { label: 'Length of day', get: (b) => b.dayLengthHours ?? Math.abs(b.rotationHours), show: (v) => fmtDuration(v), ratio: 'ratio', noun: ['longer', 'shorter'] },
  { label: 'Orbital period', get: (b) => b.orbit?.periodDays ?? b.moonOrbit?.periodDays, show: (v) => fmtPeriodDays(v), ratio: 'ratio', noun: ['longer', 'shorter'] },
  { label: 'Distance from Sun', get: helioDistance, show: (v) => `${fmt(v, 2)} AU`, ratio: 'ratio', noun: ['farther', 'closer'] },
  { label: 'Known moons', get: (b) => (b.kind === 'moon' ? undefined : b.moons.count ?? undefined), show: (v) => fmt(v) },
  { label: 'Axial tilt', get: (b) => b.axialTilt, show: (v) => `${fmt(v, 1)}°` },
]

function Picker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="hud">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass mt-2 w-full appearance-none rounded-xl px-4 py-3 font-display text-[18px] text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
      >
        {(['star', 'planet', 'dwarf', 'moon'] as const).map((k) => (
          <optgroup key={k} label={{ star: 'Star', planet: 'Planets', dwarf: 'Dwarf planets', moon: 'Moons' }[k]} className="bg-ink-900">
            {BODIES.filter((b) => b.kind === k).map((b) => (
              <option key={b.id} value={b.id} className="bg-ink-900">{b.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const a = BODY_MAP[params.get('a') ?? ''] ? params.get('a')! : 'earth'
  const b = BODY_MAP[params.get('b') ?? ''] ? params.get('b')! : 'jupiter'
  const A = BODY_MAP[a]
  const B = BODY_MAP[b]
  const setCinematic = useStore((s) => s.setCinematic)
  const travelTo = useStore((s) => s.travelTo)
  useEffect(() => {
    document.title = 'Compare Worlds — Heliora'
    if (useStore.getState().focusId) travelTo(null)
    setCinematic(true)
    return () => setCinematic(false)
  }, [setCinematic, travelTo])

  const set = (k: 'a' | 'b', v: string) => setParams((p) => { p.set(k, v); return p }, { replace: true })

  // circles drawn at true relative size
  const big = Math.max(A.radiusKm, B.radiusKm)
  const R = 120
  const ra = Math.max((A.radiusKm / big) * R, 0.6)
  const rb = Math.max((B.radiusKm / big) * R, 0.6)

  const summary = useMemo(() => {
    const out: string[] = []
    const d = A.radiusKm / B.radiusKm
    out.push(d >= 1 ? `${A.name} is ${fmtRatio(d)} as wide as ${B.name}.` : `${B.name} is ${fmtRatio(1 / d)} as wide as ${A.name}.`)
    const g = A.gravity / B.gravity
    out.push(`On ${A.name} you would weigh ${fmtRatio(g)} what you weigh on ${B.name}.`)
    const vol = Math.pow(Math.max(d, 1 / d), 3)
    if (vol > 1.5) out.push(`About ${fmt(vol, vol < 10 ? 1 : 0)} ${d >= 1 ? B.name : A.name}s would fit inside ${d >= 1 ? A.name : B.name} by volume.`)
    return out
  }, [A, B])

  return (
    <>
      <div className="page-scrim" />
      <main className="page z-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="max-w-2xl animate-fade-up">
            <p className="hud !text-cyan-300/90">Compare worlds</p>
            <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-light leading-tight text-white">Side by side, to scale.</h1>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Picker label="World A" value={a} onChange={(v) => set('a', v)} />
            <Picker label="World B" value={b} onChange={(v) => set('b', v)} />
          </div>

          <section className="glass mt-4 rounded-2xl p-5 sm:p-8">
            <svg viewBox={`0 0 ${R * 4 + 80} ${R * 2 + 40}`} className="mx-auto block w-full max-w-2xl" role="img" aria-label={`${A.name} and ${B.name} at true relative size`}>
              <defs>
                {[A, B].map((x) => (
                  <radialGradient key={x.id} id={`g-${x.id}`} cx="35%" cy="32%" r="75%">
                    <stop offset="0%" stopColor={x.accent} />
                    <stop offset="55%" stopColor={x.accent} stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#05070c" />
                  </radialGradient>
                ))}
              </defs>
              <line x1="0" x2={R * 4 + 80} y1={R * 2 + 20} y2={R * 2 + 20} stroke="rgba(255,255,255,0.08)" />
              <circle cx={R + 20} cy={R * 2 + 20 - ra} r={ra} fill={`url(#g-${A.id})`} />
              <circle cx={R * 3 + 60} cy={R * 2 + 20 - rb} r={rb} fill={`url(#g-${B.id})`} />
              {ra < 3 && <circle cx={R + 20} cy={R * 2 + 20 - ra} r={8} fill="none" stroke={A.accent} strokeOpacity={0.6} />}
              {rb < 3 && <circle cx={R * 3 + 60} cy={R * 2 + 20 - rb} r={8} fill="none" stroke={B.accent} strokeOpacity={0.6} />}
            </svg>
            <div className="mx-auto mt-2 grid max-w-2xl grid-cols-2 text-center">
              <p className="font-display text-[18px] text-white">{A.name}</p>
              <p className="font-display text-[18px] text-white">{B.name}</p>
            </div>
            <div className="mx-auto mt-5 max-w-2xl space-y-1 text-center text-[14px] text-ink-200">
              {summary.map((s) => <p key={s}>{s}</p>)}
            </div>
            <p className="mt-4 text-center text-[11px] text-ink-500">Discs drawn at true relative diameter; colours are representative, not imagery.</p>
          </section>

          <section className="glass mt-4 overflow-hidden rounded-2xl">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="stat-label px-5 py-3 font-normal">Property</th>
                  <th className="stat-label px-3 py-3 font-normal" style={{ color: A.accent }}>{A.name}</th>
                  <th className="stat-label px-3 py-3 font-normal" style={{ color: B.accent }}>{B.name}</th>
                  <th className="stat-label hidden px-5 py-3 font-normal md:table-cell">Difference</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const va = m.get(A)
                  const vb = m.get(B)
                  let diff = '—'
                  if (va !== undefined && vb !== undefined) {
                    if (m.ratio === 'diff') diff = `${fmt(Math.abs(va - vb))} °C ${va > vb ? 'warmer' : 'colder'}`
                    else if (m.ratio === 'ratio' && vb !== 0 && va !== 0) {
                      const r = va / vb
                      diff = r >= 1 ? `${fmtRatio(r)} ${m.noun![0]}` : `${fmtRatio(1 / r)} ${m.noun![1]}`
                      if (Math.abs(r - 1) < 0.005) diff = 'About the same'
                    }
                  }
                  const max = Math.max(Math.abs(va ?? 0), Math.abs(vb ?? 0)) || 1
                  const logBar = (v?: number) => (v === undefined || m.ratio === 'diff' || v <= 0 ? 0 : Math.max(2, (Math.log10(v + 1) / Math.log10(max + 1)) * 100))
                  return (
                    <tr key={m.label} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-3 text-ink-400">{m.label}</td>
                      {[va, vb].map((v, i) => (
                        <td key={i} className="px-3 py-3 align-top">
                          <span className="tabular-nums text-ink-50">{v === undefined ? '—' : m.show(v)}</span>
                          {logBar(v) > 0 && (
                            <span className="mt-1.5 block h-[3px] w-full max-w-[160px] rounded bg-white/[0.05]">
                              <span className="block h-full rounded" style={{ width: `${logBar(v)}%`, background: i ? B.accent : A.accent }} />
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="hidden px-5 py-3 text-ink-200 md:table-cell">{m.ratio ? `${A.name}: ${diff}` : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="border-t border-white/[0.06] px-5 py-3 text-[11px] text-ink-500">
              Bars use a logarithmic scale. Temperatures are representative means (see each world’s notes); gas giant values are at the 1-bar level. For moons, distance from the Sun is their planet’s.
            </p>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn" to={`/explore/${a}`}>Fly to {A.name}</Link>
            <Link className="btn" to={`/explore/${b}`}>Fly to {B.name}</Link>
          </div>

          <section className="mt-16">
            <ScaleExplorer />
          </section>
        </div>
      </main>
    </>
  )
}
