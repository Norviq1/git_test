import { Link, useLocation } from 'react-router-dom'

/** Backdrop shown when WebGL 2 is unavailable or the 3D scene fails. The rest of the site still works. */
export function Fallback() {
  const { pathname } = useLocation()
  return (
    <div className="fixed inset-0 overflow-hidden bg-void">
      <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#ffe2b0_0%,#ff9a3c_28%,rgba(255,120,30,0.15)_52%,transparent_70%)] opacity-50" />
      {!pathname.startsWith('/explore') && (
        <p className="absolute left-1/2 top-[64px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] text-ink-400">3D view unavailable on this device</p>
      )}
    </div>
  )
}

export function ExplorerUnavailable() {
  return (
    <main className="fixed inset-0 z-10 flex items-center justify-center px-5">
      <div className="glass-strong max-w-md rounded-2xl p-6 text-center">
        <p className="hud !text-flare-300">3D unavailable</p>
        <h1 className="mt-2 font-display text-[24px] font-light text-white">This device can’t run the 3D explorer</h1>
        <p className="mt-3 text-[14px] text-ink-200">
          The explorer needs WebGL 2, which is disabled or unsupported here. Try another browser, enable hardware acceleration, or keep exploring with the rest of the site:
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link className="btn" to="/encyclopedia">Encyclopedia</Link>
          <Link className="btn" to="/compare">Compare worlds</Link>
          <Link className="btn" to="/science">Science & scale</Link>
        </div>
      </div>
    </main>
  )
}
