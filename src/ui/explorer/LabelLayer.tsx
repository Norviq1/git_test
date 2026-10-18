import { useNavigate } from 'react-router-dom'
import { BODIES } from '@/data/bodies'
import { labelEls } from '@/three/Labels'
import { useStore } from '@/store/useStore'

/** Screen-space labels. Positions are written directly from the render loop. */
export function LabelLayer() {
  const travelTo = useStore((s) => s.travelTo)
  const navigate = useNavigate()
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden>
      {BODIES.map((b) => (
        <div
          key={b.id}
          className="label"
          style={{ opacity: 0 }}
          ref={(el) => {
            if (el) labelEls[b.id] = { root: el, detail: el.querySelector('[data-detail]') as HTMLElement }
            else delete labelEls[b.id]
          }}
        >
          <button
            className={`label-name flex flex-col items-center rounded-full border border-transparent px-2 py-0.5 transition hover:border-white/20 ${b.kind === 'moon' ? 'text-[10.5px] text-ink-400' : b.kind === 'dwarf' ? 'text-[11px] text-ink-400' : 'text-[12px] text-ink-200'}`}
            onClick={() => {
              travelTo(b.id)
              navigate(`/explore/${b.id}`)
            }}
            tabIndex={-1}
          >
            <span className="flex items-center gap-1.5 font-display tracking-wide">
              {b.kind !== 'moon' && <span className="h-1 w-1 rounded-full" style={{ background: b.accent }} />}
              {b.name}
            </span>
            <span data-detail className="font-mono text-[9.5px] tracking-wider text-cyan-300/80" />
          </button>
        </div>
      ))}
    </div>
  )
}
