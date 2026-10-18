import { useEffect, useRef, useState } from 'react'
import { BODY_MAP } from '@/data/bodies'
import { AU_KM } from '@/lib/orbit'
import { fmtKm, fmtLightTime } from '@/lib/format'
import { helioAU } from '@/store/sim'
import { useStore } from '@/store/useStore'

/** Real-world separation (km) between two bodies right now. */
function realDistanceKm(a: string | null, b: string) {
  const ba = a ? BODY_MAP[a] : undefined
  const bb = BODY_MAP[b]
  const sysA = ba ? (ba.parent ?? ba.id) : 'sun'
  const sysB = bb.parent ?? bb.id
  if (sysA === sysB) {
    // same planetary system: use moon distances
    const da = ba?.moonOrbit?.distanceKm ?? 0
    const db = bb.moonOrbit?.distanceKm ?? 0
    return Math.abs(da - db) || Math.max(da, db)
  }
  const pa = sysA === 'sun' ? helioAU.sun.clone().set(0, 0, 0) : helioAU[sysA]
  const pb = sysB === 'sun' ? helioAU.sun.clone().set(0, 0, 0) : helioAU[sysB]
  return pa.distanceTo(pb) * AU_KM
}

export function TravelHud() {
  const focus = useStore((s) => s.focusId)
  const travelling = useStore((s) => s.travelling)
  const prev = useRef<string | null>(null)
  const [info, setInfo] = useState<{ to: string; km: number } | null>(null)

  useEffect(() => {
    if (focus && focus !== prev.current) setInfo({ to: focus, km: realDistanceKm(prev.current, focus) })
    prev.current = focus
  }, [focus])

  if (!travelling || !info || !focus) return null
  const body = BODY_MAP[info.to]
  return (
    <div className="pointer-events-none fixed left-1/2 top-[76px] z-20 -translate-x-1/2 animate-fade-up">
      <div className="glass flex items-center gap-4 rounded-full px-5 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/70" />
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
        </span>
        <span className="text-[13px] text-ink-50">En route to <span className="font-display" style={{ color: body.accent }}>{body.name}</span></span>
        {info.km > 0 && (
          <span className="hidden font-mono text-[11px] text-ink-400 sm:inline">
            {fmtKm(info.km)} · light takes {fmtLightTime(info.km).replace('light-', '')}
          </span>
        )}
      </div>
    </div>
  )
}
