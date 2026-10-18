import { useEffect, useRef } from 'react'
import { BODY_MAP } from '@/data/bodies'
import { AU_KM, sampleOrbitAU, visVivaKms } from '@/lib/orbit'
import { fmt, fmtKm, fmtLightTime, fmtPeriodDays } from '@/lib/format'
import { helioAU } from '@/store/sim'
import { useStore } from '@/store/useStore'
import { IconClose } from '../icons'

/** Live orbital readout for the selected body (or the planet a moon belongs to). */
export function OrbitInspector() {
  const open = useStore((s) => s.inspectorOpen)
  const sel = useStore((s) => s.selectedId)
  const toggle = useStore((s) => s.toggle)
  const id = sel ? (BODY_MAP[sel].orbit ? sel : BODY_MAP[sel].parent ?? null) : null
  const rRef = useRef<HTMLSpanElement>(null)
  const vRef = useRef<HTMLSpanElement>(null)
  const lRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const body = id ? BODY_MAP[id] : undefined
  const el = body?.orbit

  const view = 100
  const scale = el ? (view * 0.9) / (el.a * (1 + el.e)) : 1
  const path = el
    ? sampleOrbitAU(el, 180).map((p, i) => `${i ? 'L' : 'M'}${(p.x * scale).toFixed(2)},${(p.z * scale).toFixed(2)}`).join(' ') + 'Z'
    : ''

  useEffect(() => {
    if (!open || !el || !id) return
    let raf = 0
    let last = 0
    const loop = (t: number) => {
      if (t - last > 120) {
        last = t
        const p = helioAU[id]
        const r = p.length()
        if (rRef.current) rRef.current.textContent = `${fmt(r, 3)} AU · ${fmtKm(r * AU_KM)}`
        if (vRef.current) vRef.current.textContent = `${fmt(visVivaKms(r, el.a), 2)} km/s`
        if (lRef.current) lRef.current.textContent = fmtLightTime(r * AU_KM)
        dotRef.current?.setAttribute('cx', String(p.x * scale))
        dotRef.current?.setAttribute('cy', String(p.z * scale))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [open, el, id, scale])

  if (!open || !body || !el) return null
  const peri = el.a * (1 - el.e)
  const aph = el.a * (1 + el.e)
  return (
    <div className="glass-strong pointer-events-auto w-[min(92vw,330px)] rounded-2xl p-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="hud">Orbit inspector · {body.name}</p>
        <button className="text-ink-400 hover:text-white" onClick={() => toggle('inspectorOpen')} aria-label="Close orbit inspector">
          <IconClose />
        </button>
      </div>
      <div className="mt-3 flex gap-4">
        <svg viewBox={`${-view} ${-view} ${view * 2} ${view * 2}`} className="h-28 w-28 shrink-0" aria-label="Top-down orbit diagram">
          <circle r={view * 0.95} fill="none" stroke="rgba(255,255,255,0.04)" />
          <path d={path} fill="none" stroke={body.accent} strokeOpacity={0.7} strokeWidth={1.2} />
          <circle r={4} fill="#ffa552" style={{ filter: 'drop-shadow(0 0 4px #ffa552)' }} />
          <circle ref={dotRef} r={4.5} fill="#fff" />
        </svg>
        <dl className="min-w-0 flex-1 space-y-1.5 text-[12px]">
          <div><dt className="stat-label">Distance now</dt><dd><span ref={rRef} className="tabular-nums" /></dd></div>
          <div><dt className="stat-label">Speed now</dt><dd><span ref={vRef} className="tabular-nums" /></dd></div>
          <div><dt className="stat-label">Sunlight travel time</dt><dd><span ref={lRef} className="tabular-nums" /></dd></div>
        </dl>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3 text-[12px]">
        <dt className="text-ink-400">Semi-major axis</dt><dd className="text-right tabular-nums">{fmt(el.a, 3)} AU</dd>
        <dt className="text-ink-400">Perihelion</dt><dd className="text-right tabular-nums">{fmt(peri, 3)} AU</dd>
        <dt className="text-ink-400">Aphelion</dt><dd className="text-right tabular-nums">{fmt(aph, 3)} AU</dd>
        <dt className="text-ink-400">Eccentricity</dt><dd className="text-right tabular-nums">{fmt(el.e, 4)}</dd>
        <dt className="text-ink-400">Inclination</dt><dd className="text-right tabular-nums">{fmt(el.i, 2)}°</dd>
        <dt className="text-ink-400">Period</dt><dd className="text-right tabular-nums">{fmtPeriodDays(el.periodDays)}</dd>
      </dl>
      <p className="mt-3 text-[10.5px] leading-relaxed text-ink-500">Two-body Keplerian orbit from JPL J2000 elements; speed from the vis-viva equation. Diagram is top-down, to scale for this orbit.</p>
    </div>
  )
}
