import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { BodyDetails, KeyStats } from '@/ui/BodyDetails'
import { IconChevron } from '@/ui/icons'

export default function BodyPage() {
  const { id = 'earth' } = useParams()
  const navigate = useNavigate()
  const body = BODY_MAP[id]
  const travelTo = useStore((s) => s.travelTo)
  const select = useStore((s) => s.select)
  const setCinematic = useStore((s) => s.setCinematic)
  const setViewShift = useStore((s) => s.setViewShift)
  const [wide, setWide] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 1024)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  useEffect(() => {
    if (!body) return
    document.title = `${body.name} — Heliora`
    setCinematic(true)
    travelTo(body.id)
    return () => {
      setCinematic(false)
      select(null)
    }
  }, [body, travelTo, setCinematic, select])

  useEffect(() => {
    setViewShift(wide ? -Math.round(window.innerWidth * 0.22) : 0)
    return () => setViewShift(0)
  }, [wide, setViewShift])

  if (!body) {
    return (
      <main className="page z-10 flex items-center justify-center">
        <p className="text-ink-200">Unknown object. <Link className="text-cyan-300" to="/encyclopedia">Back to the encyclopedia</Link></p>
      </main>
    )
  }
  const i = BODIES.findIndex((b) => b.id === body.id)
  const prev = BODIES[(i - 1 + BODIES.length) % BODIES.length]
  const next = BODIES[(i + 1) % BODIES.length]

  return (
    <main className="fixed inset-x-0 bottom-0 top-[42vh] z-10 overflow-y-auto lg:left-auto lg:top-0 lg:w-[min(52vw,720px)]">
      <div className="min-h-full bg-gradient-to-b from-void/70 via-void/90 to-void px-5 pb-24 pt-8 sm:px-10 lg:bg-gradient-to-r lg:from-void/40 lg:via-void/85 lg:to-void/95 lg:pt-24">
        <nav className="hud flex items-center gap-2">
          <Link to="/encyclopedia" className="hover:text-ink-50">Encyclopedia</Link>
          <span>/</span>
          <span className="text-ink-200">{body.name}</span>
        </nav>
        <header className="mt-5 animate-fade-up">
          <p className="hud" style={{ color: body.accent }}>{body.classification}</p>
          <h1 className="mt-2 font-display text-[clamp(40px,6vw,72px)] font-light leading-none tracking-[-0.02em] text-white">{body.name}</h1>
          <p className="mt-3 text-[16px] text-ink-200">{body.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => navigate(`/explore/${body.id}`)}>Explore in 3D <IconChevron /></button>
            <Link className="btn" to={`/compare?a=${body.id}&b=${body.id === 'earth' ? 'mars' : 'earth'}`}>Compare</Link>
          </div>
        </header>
        <div className="mt-8"><KeyStats body={body} /></div>
        <div className="glass mt-6 rounded-2xl px-5">
          <BodyDetails body={body} />
        </div>
        <div className="mt-8 flex justify-between gap-3">
          <Link className="btn" to={`/encyclopedia/${prev.id}`}>← {prev.name}</Link>
          <Link className="btn" to={`/encyclopedia/${next.id}`}>{next.name} →</Link>
        </div>
      </div>
    </main>
  )
}
