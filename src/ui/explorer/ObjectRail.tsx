import { BODY_MAP, moonsOf } from '@/data/bodies'
import { useStore } from '@/store/useStore'

const ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

export function ObjectRail({ onPick }: { onPick: (id: string) => void }) {
  const selected = useStore((s) => s.selectedId)
  const focus = useStore((s) => s.focusId)
  const active = selected ?? focus
  const activeSystem = active ? (BODY_MAP[active].parent ?? active) : null
  return (
    <>
      {/* desktop: vertical rail */}
      <nav className="pointer-events-auto hidden max-h-[calc(100vh-220px)] flex-col gap-0.5 overflow-y-auto pr-1 lg:flex" aria-label="Celestial objects">
        {ORDER.map((id) => {
          const b = BODY_MAP[id]
          const moons = moonsOf(id)
          const on = active === id
          return (
            <div key={id}>
              <button
                onClick={() => onPick(id)}
                className={`group flex w-full items-center gap-3 rounded-full py-1.5 pl-2 pr-4 text-left transition ${on ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
              >
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="h-2 w-2 rounded-full transition group-hover:scale-125" style={{ background: b.accent, boxShadow: on ? `0 0 12px ${b.accent}` : undefined }} />
                </span>
                <span className={`text-[13px] ${on ? 'text-white' : b.kind === 'dwarf' ? 'text-ink-400' : 'text-ink-200'}`}>{b.name}</span>
              </button>
              {activeSystem === id && moons.length > 0 && (
                <div className="mb-1 ml-[13px] border-l border-white/10 pl-3">
                  {moons.map((m) => (
                    <button key={m.id} onClick={() => onPick(m.id)} className={`block w-full rounded-full px-2 py-1 text-left text-[12px] transition ${active === m.id ? 'text-cyan-300' : 'text-ink-400 hover:text-ink-50'}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      {/* mobile: horizontal strip */}
      <nav className="pointer-events-auto -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Celestial objects">
        {ORDER.flatMap((id) => (activeSystem === id ? [id, ...moonsOf(id).map((m) => m.id)] : [id])).map((id) => {
          const b = BODY_MAP[id]
          const on = active === id
          return (
            <button key={id} onClick={() => onPick(id)} className={`glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] ${on ? '!border-cyan-400/50 text-white' : b.kind === 'moon' ? 'text-ink-400' : 'text-ink-200'}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.accent }} />
              {b.name}
            </button>
          )
        })}
      </nav>
    </>
  )
}
