import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { IconChevron } from '@/ui/icons'
import { MOONS } from '@/data/bodies'

const STATS = [
  ['1', 'Star'],
  ['8', 'Planets'],
  [String(MOONS.length), 'Explorable moons'],
  ['13k', 'Belt particles'],
]

export default function Home() {
  const setCinematic = useStore((s) => s.setCinematic)
  const travelTo = useStore((s) => s.travelTo)
  const select = useStore((s) => s.select)
  useEffect(() => {
    document.title = 'Heliora — Solar System Explorer'
    if (useStore.getState().focusId) travelTo(null)
    select(null)
    setCinematic(true)
    return () => setCinematic(false)
  }, [setCinematic, travelTo, select])

  return (
    <main className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-end">
      <div className="absolute inset-x-0 bottom-0 h-[60vh] bg-gradient-to-t from-void via-void/60 to-transparent" />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-[max(env(safe-area-inset-bottom),28px)] sm:px-8 sm:pb-14">
        <p className="hud animate-fade-up !text-cyan-300/90">Interactive · real orbital data · {new Date().getUTCFullYear()}</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(34px,5.4vw,64px)] font-light leading-[1.02] tracking-[-0.02em] text-white animate-fade-up [animation-delay:80ms]">
          Our cosmic neighbourhood,
          <br />
          <span className="text-ink-400">to explore in real time.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-200 animate-fade-up [animation-delay:160ms]">
          Fly between the Sun, eight planets and their major moons. Positions come from NASA JPL orbital elements for today’s date; every number has a source, and every visual shortcut is labelled.
        </p>
        <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:240ms]">
          <Link to="/explore" className="btn-primary h-12 px-6 text-[14px]">
            Launch explorer <IconChevron />
          </Link>
          <Link to="/explore/earth" className="btn h-12 px-5">Start at Earth</Link>
          <Link to="/encyclopedia" className="btn h-12 px-5">Encyclopedia</Link>
        </div>
        <dl className="mt-10 hidden max-w-xl grid-cols-4 gap-6 border-t border-white/[0.07] pt-5 sm:grid animate-fade-up [animation-delay:320ms]">
          {STATS.map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-[22px] font-light text-white">{v}</dd>
              <p className="hud mt-1">{l}</p>
            </div>
          ))}
        </dl>
      </div>
    </main>
  )
}
