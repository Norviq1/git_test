import { useState } from 'react'
import { BODY_MAP, PLANET_IDS } from '@/data/bodies'
import { AU_KM } from '@/lib/orbit'
import { fmt, fmtLightTime } from '@/lib/format'

const SUN = BODY_MAP.sun
const PLANETS = PLANET_IDS.map((id) => BODY_MAP[id])

function fmtLen(m: number) {
  if (m < 0.01) return `${fmt(m * 1000, 1)} mm`
  if (m < 1) return `${fmt(m * 100, 1)} cm`
  if (m < 1000) return `${fmt(m, m < 10 ? 1 : 0)} m`
  return `${fmt(m / 1000, 1)} km`
}

/** Sizes and distances at true scale, plus an everyday-object analogy. */
export function ScaleExplorer() {
  const [log, setLog] = useState(false)
  const [marble, setMarble] = useState(2.5) // Earth diameter in cm

  // size lineup: Sun's limb on the left, planets at true relative size
  const W = 1000
  const H = 260
  const k = (H * 0.42) / BODY_MAP.jupiter.radiusKm
  const sunR = SUN.radiusKm * k
  let x = 70
  const lineup = PLANETS.map((p) => {
    const r = Math.max(p.radiusKm * k, 1)
    x += r + 20
    const cx = x
    x += r + 14
    return { p, r, cx }
  })
  const scaleW = x + 20

  // distance track
  const maxAU = 31
  const pos = (au: number) => (log ? (Math.log10(au / 0.3) / Math.log10(maxAU / 0.3)) * 100 : (au / maxAU) * 100)

  const earthCm = marble
  const kmToM = (km: number) => (km / (BODY_MAP.earth.radiusKm * 2)) * (earthCm / 100)

  return (
    <div>
      <div className="mb-6 max-w-2xl">
        <p className="hud !text-cyan-300/90">Scale explorer</p>
        <h2 className="mt-3 font-display text-[clamp(26px,3vw,36px)] font-light leading-tight text-white">How big, how far?</h2>
        <p className="mt-2 text-[14px] text-ink-200">Sizes and distances in the Solar System differ so much that no single picture can show both. Here they are separately — each at its own true scale.</p>
      </div>

      <div className="glass overflow-x-auto rounded-2xl p-5">
        <p className="hud mb-3">Relative sizes · true scale</p>
        <svg viewBox={`0 0 ${Math.max(W, scaleW)} ${H}`} className="h-[220px] min-w-[720px] w-full" role="img" aria-label="Planets at true relative size next to the edge of the Sun">
          <defs>
            <radialGradient id="sunEdge" cx="0" cy="0.5" r="1">
              <stop offset="0.85" stopColor="#ffb766" />
              <stop offset="1" stopColor="#ff8a2a" />
            </radialGradient>
          </defs>
          <circle cx={60 - sunR} cy={H / 2} r={sunR} fill="url(#sunEdge)" />
          {lineup.map(({ p, r, cx }) => (
            <g key={p.id}>
              <circle cx={cx} cy={H / 2} r={r} fill={p.accent} />
              {p.id === 'saturn' && <ellipse cx={cx} cy={H / 2} rx={r * 2.27} ry={r * 0.32} fill="none" stroke={p.accent} strokeOpacity={0.5} strokeWidth={r * 0.18} />}
              <text x={cx} y={H / 2 + Math.max(r, 6) + 18} textAnchor="middle" className="fill-ink-400" fontSize="12" fontFamily="Inter Tight">{p.name}</text>
            </g>
          ))}
          <text x={8} y={20} className="fill-ink-500" fontSize="11" fontFamily="JetBrains Mono">SUN (edge) · ⌀ 1,391,400 km</text>
        </svg>
        <p className="mt-2 text-[12px] text-ink-400">The Sun’s diameter is about 109 Earths and almost 10 Jupiters.</p>
      </div>

      <div className="glass mt-4 rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="hud">Distances from the Sun · {log ? 'logarithmic' : 'linear, true scale'}</p>
          <div className="flex rounded-full border border-white/10 p-1 text-[12px]">
            <button className={`rounded-full px-3 py-1 ${!log ? 'bg-white/10 text-white' : 'text-ink-400'}`} onClick={() => setLog(false)}>Linear</button>
            <button className={`rounded-full px-3 py-1 ${log ? 'bg-white/10 text-white' : 'text-ink-400'}`} onClick={() => setLog(true)}>Log</button>
          </div>
        </div>
        <div className="relative h-24">
          <div className="absolute inset-x-0 top-10 h-px bg-gradient-to-r from-flare-400/80 via-white/15 to-white/5" />
          <span className="absolute top-[33px] h-4 w-4 -translate-x-1/2 rounded-full bg-flare-400 shadow-[0_0_14px_#ffa552]" style={{ left: `${log ? 0 : 0}%` }} />
          {PLANETS.map((p, i) => (
            <div key={p.id} className="absolute top-0 -translate-x-1/2 text-center transition-all duration-700" style={{ left: `${Math.max(pos(p.orbit!.a), 1)}%` }}>
              <span className={`block whitespace-nowrap text-[11px] text-ink-200 ${i % 2 ? 'mt-16' : ''}`}>{p.name}</span>
              <span className="absolute left-1/2 top-[37px] h-2 w-2 -translate-x-1/2 rounded-full" style={{ background: p.accent }} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-[12.5px] text-ink-400 sm:grid-cols-4">
          {PLANETS.filter((_, i) => i % 2 === 0 || i === 7).map((p) => (
            <p key={p.id}><span className="text-ink-200">{p.name}:</span> sunlight takes {fmtLightTime(p.orbit!.a * AU_KM).replace('light-', '')}</p>
          ))}
        </div>
        {!log && <p className="mt-3 text-[12px] text-ink-500">At this scale the four inner planets crowd into the first 5% of the line — and every planet would be far smaller than a pixel.</p>}
      </div>

      <div className="glass mt-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[14px] text-ink-200">If Earth were a marble</p>
          <input type="range" min={0.5} max={10} step={0.5} value={marble} onChange={(e) => setMarble(+e.target.value)} className="w-40" aria-label="Earth model diameter" />
          <span className="font-mono text-[13px] text-cyan-300">{fmt(marble, 1)} cm</span>
          <p className="text-[14px] text-ink-200">across…</p>
        </div>
        <ul className="mt-4 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <li><span className="text-ink-400">the Sun would be</span> {fmtLen(kmToM(SUN.radiusKm * 2))} wide, {fmtLen(kmToM(AU_KM))} away</li>
          <li><span className="text-ink-400">the Moon would orbit</span> {fmtLen(kmToM(384_400))} away</li>
          <li><span className="text-ink-400">Jupiter would be</span> {fmtLen(kmToM(BODY_MAP.jupiter.radiusKm * 2))} wide, {fmtLen(kmToM(BODY_MAP.jupiter.orbit!.a * AU_KM))} from the Sun</li>
          <li><span className="text-ink-400">Neptune would be</span> {fmtLen(kmToM(BODY_MAP.neptune.orbit!.a * AU_KM))} from the Sun</li>
          <li><span className="text-ink-400">the nearest star, Proxima Centauri,</span> {fmtLen(kmToM(4.0175e13))} away</li>
          <li><span className="text-ink-400">Voyager 1 (~170 AU, 2026)</span> {fmtLen(kmToM(170 * AU_KM))} away</li>
        </ul>
      </div>
    </div>
  )
}
