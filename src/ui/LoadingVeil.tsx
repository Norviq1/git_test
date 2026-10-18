import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'

/** Brief loading veil while the scene compiles shaders and loads textures. */
export function LoadingVeil() {
  const ready = useStore((s) => s.sceneReady)
  const webglOk = useStore((s) => s.webglOk)
  const { progress } = useProgress()
  const [gone, setGone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  // textures stream in behind the veil; never block the explorer on them
  const done = ready || !webglOk || timedOut
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 9000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 900)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-void transition-opacity duration-700 ${done ? 'pointer-events-none opacity-0' : 'opacity-100'}`} role="status" aria-live="polite">
      <div className="relative h-16 w-16">
        <div className="absolute inset-[22px] rounded-full bg-flare-400 shadow-[0_0_40px_10px_rgba(255,165,82,0.45)]" />
        <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-cyan-400/80 [animation-duration:2.4s]" />
      </div>
      <p className="hud mt-6">Initialising star system · {Math.round(ready ? 100 : Math.min(progress, 96))}%</p>
    </div>
  )
}
