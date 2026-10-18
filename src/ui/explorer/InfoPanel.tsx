import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { BodyDetails, KeyStats } from '../BodyDetails'
import { IconClose, IconOrbit } from '../icons'

export function InfoPanel({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const id = useStore((s) => s.selectedId)
  const toggleInspector = useStore((s) => s.toggle)
  const inspector = useStore((s) => s.inspectorOpen)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [id])
  if (!id) return null
  const body = BODY_MAP[id]
  const parent = body.parent ? BODY_MAP[body.parent] : undefined
  return (
    <aside
      key={id}
      className={`glass-strong pointer-events-auto fixed z-20 flex flex-col overflow-hidden animate-slide-in
        inset-x-2 bottom-2 rounded-2xl ${expanded ? 'top-[72px]' : 'max-h-[46vh]'}
        lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-[72px] lg:max-h-none lg:w-[400px]`}
      aria-label={`${body.name} information`}
    >
      <button className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? 'Collapse panel' : 'Expand panel'} />
      <header className="relative shrink-0 px-5 pb-4 pt-4">
        <div className="absolute inset-x-0 top-0 h-24 opacity-30" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${body.accent}55, transparent 70%)` }} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="hud">
              {body.classification}
              {parent && (
                <>
                  {' · '}
                  <button className="text-cyan-300 hover:underline" onClick={() => onPick(parent.id)}>{parent.name}</button>
                </>
              )}
            </p>
            <h2 className="mt-1.5 font-display text-[30px] font-light leading-none tracking-tight text-white">{body.name}</h2>
            <p className="mt-2 text-[13px] text-ink-400">{body.tagline}</p>
          </div>
          <button className="icon-btn shrink-0" onClick={onClose} aria-label="Close panel">
            <IconClose />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" onTouchStart={() => !expanded && setExpanded(true)}>
        <KeyStats body={body} compact />
        <div className="mt-2">
          <BodyDetails body={body} onNavigate={onPick} />
        </div>
      </div>
      <footer className="flex shrink-0 gap-2 border-t border-white/[0.06] px-4 py-3">
        <Link to={`/encyclopedia/${id}`} className="btn flex-1 !px-3 text-[12px]">Full page</Link>
        <Link to={`/compare?a=${id}&b=${id === 'earth' ? 'mars' : 'earth'}`} className="btn flex-1 !px-3 text-[12px]">Compare</Link>
        {(body.orbit || parent?.orbit) && (
          <button className={`btn !px-3 text-[12px] ${inspector ? '!border-cyan-400/50 !text-cyan-300' : ''}`} onClick={() => toggleInspector('inspectorOpen')} aria-pressed={inspector}>
            <IconOrbit /> Orbit
          </button>
        )}
      </footer>
    </aside>
  )
}
