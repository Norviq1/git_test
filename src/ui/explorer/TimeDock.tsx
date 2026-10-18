import { useEffect, useRef } from 'react'
import { sim } from '@/store/sim'
import { useStore } from '@/store/useStore'
import { daysToDate } from '@/lib/orbit'
import { IconPause, IconPlay, IconReverse } from '../icons'

export const SPEEDS = [
  { v: 1 / 86400, l: 'Real time' },
  { v: 1 / 1440, l: '1 min / s' },
  { v: 1 / 24, l: '1 hour / s' },
  { v: 0.25, l: '6 hours / s' },
  { v: 1, l: '1 day / s' },
  { v: 2, l: '2 days / s' },
  { v: 7, l: '1 week / s' },
  { v: 30.44, l: '1 month / s' },
  { v: 91.31, l: '3 months / s' },
  { v: 365.25, l: '1 year / s' },
  { v: 3652.5, l: '10 years / s' },
]

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })

export function TimeDock() {
  const speed = useStore((s) => s.speed)
  const paused = useStore((s) => s.paused)
  const setSpeed = useStore((s) => s.setSpeed)
  const togglePause = useStore((s) => s.togglePause)
  const resetTime = useStore((s) => s.resetTime)
  const dateRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let last = 0
    const loop = (t: number) => {
      if (t - last > 90) {
        last = t
        const d = daysToDate(sim.days)
        if (dateRef.current) dateRef.current.textContent = isNaN(d.getTime()) ? '—' : fmtDate(d)
        if (timeRef.current) timeRef.current.textContent = `${fmtTime(d)} UTC`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const idx = SPEEDS.reduce((best, s, i) => (Math.abs(Math.log(s.v) - Math.log(Math.abs(speed))) < Math.abs(Math.log(SPEEDS[best].v) - Math.log(Math.abs(speed))) ? i : best), 0)
  const dir = Math.sign(speed) || 1

  return (
    <div className="glass pointer-events-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-4 sm:px-4" role="group" aria-label="Time controls">
      <div className="min-w-[84px] leading-tight sm:min-w-[96px]">
        <span ref={dateRef} className="block font-mono text-[13px] tabular-nums text-ink-50" />
        <span ref={timeRef} className="block font-mono text-[10px] tabular-nums text-ink-400" />
      </div>
      <div className="flex items-center gap-1.5">
        <button className={`icon-btn ${dir < 0 ? '!border-flare-400/60 !text-flare-300' : ''}`} onClick={() => setSpeed(-speed)} aria-label={dir < 0 ? 'Run time forwards' : 'Run time backwards'} title="Reverse time">
          <IconReverse />
        </button>
        <button className="icon-btn h-10 w-10 !border-cyan-400/40 !text-cyan-300" onClick={togglePause} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? <IconPlay /> : <IconPause />}
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:w-48 sm:flex-none">
        <div className="flex items-baseline justify-between gap-2">
          <span className="hud hidden sm:inline">Rate</span>
          <span className="truncate font-mono text-[11px] text-ink-200">{dir < 0 ? '−' : ''}{SPEEDS[idx].l}</span>
        </div>
        <input type="range" min={0} max={SPEEDS.length - 1} step={1} value={idx} onChange={(e) => setSpeed(SPEEDS[+e.target.value].v * dir)} aria-label="Simulation speed" />
      </div>
      <button className="chip hidden sm:inline-flex" onClick={resetTime} title="Jump to the current date">
        Now
      </button>
    </div>
  )
}
