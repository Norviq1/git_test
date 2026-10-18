import { useEffect, useState } from 'react'
import { BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { IconClose, IconSpark } from '../icons'

/** Surfaces a scientifically sourced fact when the camera arrives at an object. */
export function FactToast() {
  const focus = useStore((s) => s.focusId)
  const travelling = useStore((s) => s.travelling)
  const [fact, setFact] = useState<{ id: string; i: number } | null>(null)

  useEffect(() => {
    if (!travelling && focus && BODY_MAP[focus].facts.length) {
      setFact({ id: focus, i: Math.floor(Math.random() * BODY_MAP[focus].facts.length) })
      const t = setTimeout(() => setFact(null), 11000)
      return () => clearTimeout(t)
    }
    if (travelling) setFact(null)
  }, [focus, travelling])

  if (!fact) return null
  const body = BODY_MAP[fact.id]
  return (
    <div className="glass pointer-events-auto w-[min(92vw,340px)] rounded-2xl p-4 animate-fade-up" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-flare-400"><IconSpark /></span>
        <div className="flex-1">
          <p className="hud">Discovery · {body.name}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-50">{body.facts[fact.i]}</p>
          {body.facts.length > 1 && (
            <button className="mt-2 text-[12px] text-cyan-300 hover:underline" onClick={() => setFact({ id: fact.id, i: (fact.i + 1) % body.facts.length })}>
              Another fact
            </button>
          )}
        </div>
        <button className="text-ink-500 hover:text-white" onClick={() => setFact(null)} aria-label="Dismiss fact">
          <IconClose />
        </button>
      </div>
    </div>
  )
}
