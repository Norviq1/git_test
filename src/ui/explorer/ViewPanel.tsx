import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { IconLayers } from '../icons'

export function ViewPanel({ placement = 'up' }: { placement?: 'up' | 'down' }) {
  const [open, setOpen] = useState(false)
  const s = useStore()
  const toggles: [string, boolean, () => void][] = [
    ['Orbits', s.showOrbits, () => s.toggle('showOrbits')],
    ['Labels', s.showLabels, () => s.toggle('showLabels')],
    ['Live data on labels', s.labelDetail, () => s.toggle('labelDetail')],
    ['Asteroid & Kuiper belts', s.showBelts, () => s.toggle('showBelts')],
  ]
  return (
    <div className="pointer-events-auto relative">
      <button className={`icon-btn glass h-10 w-10 lg:h-11 lg:w-11 ${open ? '!border-cyan-400/50 !text-cyan-300' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="View options" aria-expanded={open}>
        <IconLayers width={18} height={18} />
      </button>
      {open && (
        <div className={`glass-strong absolute z-30 w-[min(86vw,300px)] rounded-2xl p-4 animate-fade-up ${placement === 'up' ? 'bottom-14 left-0' : 'right-0 top-12'}`}>
          <p className="hud mb-2">Scale</p>
          <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 p-1">
            {(['explore', 'true'] as const).map((m) => (
              <button key={m} onClick={() => s.setScaleMode(m)} className={`rounded-full py-1.5 text-[12px] transition ${s.scaleMode === m ? 'bg-cyan-400/15 text-cyan-300' : 'text-ink-400 hover:text-ink-50'}`}>
                {m === 'explore' ? 'Explore' : 'True scale'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-400">
            {s.scaleMode === 'explore'
              ? 'Sizes enlarged (∝ radius^0.45) and distances compressed so every world is visible. Order is preserved.'
              : 'Sizes and distances share one scale: 1 AU = 1,000 units. Planets become specks — use labels or search to find them.'}
          </p>
          <p className="hud mb-2 mt-4">Layers</p>
          <div className="space-y-1">
            {toggles.map(([label, on, fn]) => (
              <button key={label} onClick={fn} className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-[13px] text-ink-200 hover:text-white" role="switch" aria-checked={on}>
                {label}
                <span className={`relative h-[18px] w-8 rounded-full transition ${on ? 'bg-cyan-400/40' : 'bg-white/10'}`}>
                  <span className={`absolute top-[3px] h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-[17px]' : 'left-[3px]'}`} />
                </span>
              </button>
            ))}
          </div>
          <p className="hud mb-2 mt-4">Render quality</p>
          <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 p-1">
            {(['high', 'low'] as const).map((q) => (
              <button key={q} onClick={() => s.setQuality(q)} className={`rounded-full py-1.5 text-[12px] capitalize transition ${s.quality === q ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-50'}`}>
                {q === 'high' ? 'Cinematic' : 'Performance'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
