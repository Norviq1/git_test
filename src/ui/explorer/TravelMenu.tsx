import { useState } from 'react'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { IconClose, IconRocket } from '../icons'

export function TravelMenu({ onPick, placement = 'up' }: { onPick: (id: string) => void; placement?: 'up' | 'down' }) {
  const [open, setOpen] = useState(false)
  const focus = useStore((s) => s.focusId)
  const groups: [string, typeof BODIES][] = [
    ['Star & planets', BODIES.filter((b) => b.kind === 'star' || b.kind === 'planet')],
    ['Dwarf planets', BODIES.filter((b) => b.kind === 'dwarf')],
    ['Moons', BODIES.filter((b) => b.kind === 'moon')],
  ]
  return (
    <div className="pointer-events-auto relative">
      <button className={`btn glass h-10 !px-3 lg:h-11 lg:!px-4 ${open ? '!border-cyan-400/50 !text-cyan-300' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <IconRocket /> <span className="hidden sm:inline">Travel</span>
      </button>
      {open && (
        <div className={`glass-strong z-30 max-h-[62vh] overflow-y-auto rounded-2xl p-4 animate-fade-up ${placement === 'up' ? 'absolute bottom-14 right-0 w-[420px]' : 'fixed inset-x-3 top-[124px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[420px]'}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="hud">Choose a destination</p>
            <button className="text-ink-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close travel menu">
              <IconClose />
            </button>
          </div>
          {groups.map(([title, list]) => (
            <div key={title} className="mb-3">
              <p className="mb-1.5 text-[11px] text-ink-500">{title}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {list.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onPick(b.id)
                      setOpen(false)
                    }}
                    className={`flex flex-col items-start rounded-xl border px-2.5 py-2 text-left transition ${focus === b.id ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <span className="mb-1.5 h-2 w-2 rounded-full" style={{ background: b.accent, boxShadow: `0 0 8px ${b.accent}` }} />
                    <span className="text-[12.5px] text-ink-50">{b.name}</span>
                    <span className="truncate text-[10.5px] text-ink-500">{b.parent ? BODY_MAP[b.parent].name : b.kind === 'star' ? 'Centre' : `${b.orbit?.a.toFixed(2)} AU`}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
