import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { IconClose, IconMenu, IconSearch } from './icons'

const LINKS = [
  { to: '/explore', label: 'Explorer' },
  { to: '/encyclopedia', label: 'Encyclopedia' },
  { to: '/compare', label: 'Compare' },
  { to: '/missions', label: 'Missions' },
  { to: '/science', label: 'Science' },
]

export function TopNav() {
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-4 pt-[max(env(safe-area-inset-top),12px)] sm:px-6">
      <Link to="/" className="pointer-events-auto flex items-center gap-2.5 py-2" aria-label="Heliora home">
        <span className="relative inline-block h-5 w-5">
          <span className="absolute inset-[5px] rounded-full bg-flare-400 shadow-[0_0_14px_3px_rgba(255,165,82,0.6)]" />
          <span className="absolute inset-0 rotate-[-20deg] rounded-[50%] border border-cyan-400/70" style={{ transform: 'rotate(-20deg) scaleY(0.38)' }} />
        </span>
        <span className="font-display text-[15px] tracking-[0.32em] text-ink-50">HELIORA</span>
      </Link>

      <nav className="glass pointer-events-auto hidden items-center gap-1 rounded-full p-1 md:flex" aria-label="Primary">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `rounded-full px-3.5 py-1.5 text-[13px] transition ${isActive || pathname.startsWith(l.to + '/') ? 'bg-white/[0.08] text-white' : 'text-ink-400 hover:text-ink-50'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="pointer-events-auto flex items-center gap-2">
        <button className="glass flex h-9 items-center gap-2 rounded-full px-3 text-[13px] text-ink-400 transition hover:text-ink-50" onClick={() => setSearchOpen(true)} aria-label="Search celestial objects">
          <IconSearch />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-white/10 px-1.5 font-mono text-[10px] text-ink-500 lg:inline">⌘K</kbd>
        </button>
        <button className="icon-btn glass md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <nav className="glass-strong pointer-events-auto absolute inset-x-4 top-[calc(max(env(safe-area-inset-top),12px)+48px)] flex flex-col rounded-2xl p-2 md:hidden" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-xl px-4 py-3 text-[15px] ${isActive ? 'bg-white/[0.06] text-white' : 'text-ink-200'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
