import { Link } from 'react-router-dom'

/** Shown when WebGL 2 is unavailable or the 3D scene fails. The rest of the site still works. */
export function Fallback() {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-void">
      <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#ffe2b0_0%,#ff9a3c_28%,rgba(255,120,30,0.15)_52%,transparent_70%)] opacity-60" />
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto w-[min(92vw,560px)] rounded-2xl border border-white/10 bg-black/60 p-4 text-center text-[13px] text-ink-200 backdrop-blur">
        Your device or browser could not start the WebGL 2 scene, so the 3D explorer is unavailable. Everything else —
        the <Link className="text-cyan-300 underline" to="/encyclopedia">encyclopedia</Link>, <Link className="text-cyan-300 underline" to="/compare">comparisons</Link> and{' '}
        <Link className="text-cyan-300 underline" to="/science">science guide</Link> — works normally.
      </div>
    </div>
  )
}
