import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { IconSearch } from './icons'

const KIND_LABEL = { star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', moon: 'Moon' } as const

const EXTRA = [
  { id: '#belt', name: 'Asteroid Belt', sub: 'Region · 2.1–3.3 AU, between Mars and Jupiter', target: 'ceres' },
  { id: '#kuiper', name: 'Kuiper Belt', sub: 'Region · ~30–50 AU, beyond Neptune', target: 'pluto' },
  { id: '#trojans', name: 'Jupiter Trojans', sub: 'Region · Jupiter’s L4 and L5 points', target: 'jupiter' },
]

export function SearchPalette() {
  const open = useStore((s) => s.searchOpen)
  const setOpen = useStore((s) => s.setSearchOpen)
  const travelTo = useStore((s) => s.travelTo)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    const items = [
      ...BODIES.map((b) => ({
        id: b.id,
        name: b.name,
        sub: `${KIND_LABEL[b.kind]}${b.parent ? ` · ${BODY_MAP[b.parent].name}` : ''} · ${b.classification}`,
        target: b.id,
      })),
      ...EXTRA,
    ]
    if (!t) return items.slice(0, 12)
    return items
      .map((it) => {
        const n = it.name.toLowerCase()
        const s = n.startsWith(t) ? 3 : n.includes(t) ? 2 : it.sub.toLowerCase().includes(t) ? 1 : 0
        return { it, s }
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.it)
  }, [q])

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => input.current?.focus(), 10)
    }
  }, [open])
  useEffect(() => setIdx(0), [q])

  if (!open) return null
  const go = (target: string) => {
    setOpen(false)
    travelTo(target)
    navigate(`/explore/${target}`)
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl animate-fade-up" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Search celestial objects">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <IconSearch className="text-ink-400" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
              if (e.key === 'Enter' && results[idx]) go(results[idx].target)
            }}
            placeholder="Search planets, moons, regions…"
            className="h-14 flex-1 bg-transparent text-[15px] text-ink-50 placeholder:text-ink-500 focus:outline-none"
            aria-label="Search"
          />
          <kbd className="rounded border border-white/10 px-1.5 font-mono text-[10px] text-ink-500">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-400">No objects match “{q}”.</li>}
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === idx}>
              <button
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === idx ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(r.target)}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BODY_MAP[r.target]?.accent ?? '#888', boxShadow: `0 0 10px ${BODY_MAP[r.target]?.accent ?? '#888'}` }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-ink-50">{r.name}</span>
                  <span className="block truncate text-[12px] text-ink-400">{r.sub}</span>
                </span>
                <span className="hud">Travel</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
