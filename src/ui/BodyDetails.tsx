import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BODY_MAP, EARTH, moonsOf } from '@/data/bodies'
import type { Body } from '@/data/types'
import { AU_KM } from '@/lib/orbit'
import { fmt, fmtDuration, fmtKm, fmtPeriodDays, fmtRatio, fmtSci } from '@/lib/format'
import { IconChevron } from './icons'

export function KeyStats({ body, compact }: { body: Body; compact?: boolean }) {
  const parent = body.parent ? BODY_MAP[body.parent] : undefined
  const stats: [string, string][] = [
    ['Diameter', `${fmt(body.radiusKm * 2)} km`],
    ['Mass', fmtSci(body.massKg, ' kg')],
    ['Surface gravity', `${fmt(body.gravity, body.gravity < 1 ? 3 : 1)} m/s²`],
    body.orbit
      ? ['Distance from Sun', `${fmt(body.orbit.a, 2)} AU · ${fmtKm(body.orbit.a * AU_KM)}`]
      : body.moonOrbit
        ? [`Distance from ${parent?.name}`, `${fmt(body.moonOrbit.distanceKm)} km`]
        : ['Distance to galactic centre', '≈ 26,000 light-years'],
    body.dayLengthHours ? ['Length of day', fmtDuration(body.dayLengthHours)] : ['Rotation period', fmtDuration(Math.abs(body.rotationHours))],
    body.orbit
      ? ['Orbital period', fmtPeriodDays(body.orbit.periodDays)]
      : body.moonOrbit
        ? ['Orbital period', `${fmtPeriodDays(body.moonOrbit.periodDays)}${body.moonOrbit.retrograde ? ' (retrograde)' : ''}`]
        : ['Galactic orbit', '≈ 230 million years'],
    ['Temperature', body.temperature.meanC !== undefined ? `${fmt(body.temperature.meanC)} °C` : 'Varies widely'],
    ['Moons', body.moons.count === null ? '—' : String(body.moons.count)],
  ]
  return (
    <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] ${compact ? '' : 'sm:grid-cols-4'}`}>
      {stats.map(([k, v]) => (
        <div key={k} className="bg-[rgba(8,11,19,0.85)] px-3 py-2.5">
          <dt className="stat-label">{k}</dt>
          <dd className="stat-value mt-1 text-[13px] leading-snug">{v}</dd>
        </div>
      ))}
      <p className="col-span-full bg-[rgba(8,11,19,0.85)] px-3 py-2 text-[11px] leading-relaxed text-ink-400">
        <span className="text-ink-200">Temperature:</span> {body.temperature.meanNote}. {body.temperature.range}.
      </p>
    </dl>
  )
}

function Section({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <section className="border-b border-white/[0.06] last:border-0">
      <button className="flex w-full items-center justify-between py-3.5 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="font-display text-[14px] tracking-wide text-ink-50">{title}</span>
        <IconChevron className={`text-ink-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="animate-fade-up pb-4 text-[13.5px] leading-relaxed text-ink-200">{children}</div>}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-cyan-400/80" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function EarthComparison({ body }: { body: Body }) {
  if (body.id === 'earth') return <p>Earth is the reference for every comparison in this explorer.</p>
  const rows: [string, string][] = [
    ['Diameter', `${fmtRatio(body.radiusKm / EARTH.radiusKm)} Earth`],
    ['Mass', `${fmtRatio(body.massEarths)} Earth`],
    ['Surface gravity', `${fmtRatio(body.gravity / EARTH.gravity)} Earth — a 70 kg person would weigh like ${fmt((70 * body.gravity) / EARTH.gravity, body.gravity < 1 ? 1 : 0)} kg`],
  ]
  if (body.densityGcm3) rows.push(['Density', `${fmtRatio(body.densityGcm3 / EARTH.densityGcm3!)} Earth`])
  if (body.dayLengthHours) rows.push(['Day length', `${fmtRatio(body.dayLengthHours / 24)} an Earth day`])
  if (body.orbit) rows.push(['Year length', `${fmtRatio(body.orbit.periodDays / 365.256)} an Earth year`])
  if (body.orbit) rows.push(['Sunlight intensity', `${fmtRatio(1 / (body.orbit.a * body.orbit.a))} Earth’s (inverse-square law)`])
  const volume = Math.pow(body.radiusKm / EARTH.radiusKm, 3)
  return (
    <div>
      <dl className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-ink-400">{k}</dt>
            <dd className="text-right tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-ink-400">
        {volume >= 1
          ? `About ${fmt(volume, volume < 10 ? 1 : 0)} Earths could fit inside ${body.name} by volume.`
          : `About ${fmt(1 / volume, 1 / volume < 10 ? 1 : 0)} ${body.name}s could fit inside Earth by volume.`}
      </p>
    </div>
  )
}

export function BodyDetails({ body, onNavigate }: { body: Body; onNavigate?: (id: string) => void }) {
  const moons = moonsOf(body.id)
  const parent = body.parent ? BODY_MAP[body.parent] : undefined
  const missionDot = { past: 'bg-ink-500', active: 'bg-emerald-400', planned: 'bg-flare-400', 'en-route': 'bg-cyan-400' } as const
  return (
    <div>
      <Section title="Overview" defaultOpen>
        <p>{body.intro}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
          <span className="text-ink-400">Classification</span><span>{body.classification}</span>
          {body.escapeVelocity && (<><span className="text-ink-400">Escape velocity</span><span>{fmt(body.escapeVelocity, 1)} km/s</span></>)}
          {body.densityGcm3 && (<><span className="text-ink-400">Mean density</span><span>{fmt(body.densityGcm3, 2)} g/cm³</span></>)}
          <span className="text-ink-400">Axial tilt</span><span>{fmt(body.axialTilt, 2)}°</span>
          <span className="text-ink-400">Sidereal rotation</span><span>{fmtDuration(Math.abs(body.rotationHours))}{body.rotationHours < 0 ? ' (retrograde)' : ''}</span>
          {body.surfacePressure && (<><span className="text-ink-400">Surface pressure</span><span>{body.surfacePressure}</span></>)}
        </div>
      </Section>
      <Section title="Atmosphere">
        <p>{body.atmosphere.summary}</p>
        {body.atmosphere.composition.length > 0 && (
          <div className="mt-3 space-y-2">
            {body.atmosphere.composition.map((g) => (
              <div key={g.gas}>
                <div className="flex justify-between text-[12.5px]">
                  <span>{g.gas}</span>
                  <span className="tabular-nums text-ink-400">{g.pct !== undefined ? `${g.pct}%` : ''}{g.note ? `${g.pct !== undefined ? ' · ' : ''}${g.note}` : ''}</span>
                </div>
                {g.pct !== undefined && (
                  <div className="mt-1 h-[3px] rounded bg-white/[0.06]">
                    <div className="h-full rounded" style={{ width: `${Math.max(1.5, g.pct)}%`, background: body.accent }} />
                  </div>
                )}
              </div>
            ))}
            {body.atmosphere.compositionNote && <p className="text-[11.5px] text-ink-400">{body.atmosphere.compositionNote}</p>}
          </div>
        )}
      </Section>
      <Section title={body.kind === 'star' ? 'Structure & surface' : 'Surface & geology'}>
        <p>{body.surface}</p>
        <Bullets items={body.geology} />
      </Section>
      <Section title="Orbit & rotation">
        {body.orbit ? (
          <div className="space-y-1.5">
            <Row k="Semi-major axis" v={`${fmt(body.orbit.a, 3)} AU (${fmtKm(body.orbit.a * AU_KM)})`} />
            <Row k="Perihelion · aphelion" v={`${fmt(body.orbit.a * (1 - body.orbit.e), 3)} · ${fmt(body.orbit.a * (1 + body.orbit.e), 3)} AU`} />
            <Row k="Eccentricity" v={fmt(body.orbit.e, 4)} />
            <Row k="Inclination to ecliptic" v={`${fmt(body.orbit.i, 2)}°`} />
            <Row k="Orbital period" v={fmtPeriodDays(body.orbit.periodDays)} />
            <Row k="Mean orbital speed" v={`${fmt(body.orbit.meanVelocityKms, 1)} km/s`} />
            {body.orbit.phaseApprox && <p className="pt-1 text-[11.5px] text-ink-400">Starting orbital phase is approximate.</p>}
          </div>
        ) : body.moonOrbit ? (
          <div className="space-y-1.5">
            <Row k={`Mean distance from ${parent?.name}`} v={`${fmt(body.moonOrbit.distanceKm)} km`} />
            <Row k="Orbital period" v={`${fmtPeriodDays(body.moonOrbit.periodDays)}${body.moonOrbit.retrograde ? ' — retrograde' : ''}`} />
            {body.moonOrbit.inclination !== undefined && <Row k="Inclination" v={`${fmt(body.moonOrbit.inclination, 2)}°`} />}
            <p className="pt-1 text-[11.5px] text-ink-400">Shown as a circular orbit with an illustrative starting position.</p>
          </div>
        ) : (
          <p>The Sun orbits the centre of the Milky Way at about 230 km/s, taking roughly 230 million years per circuit. Its equator rotates in about 25 days, its poles in about 35 — the Sun rotates differentially because it is not solid.</p>
        )}
      </Section>
      {(body.kind !== 'moon' || moons.length > 0) && (
        <Section title="Moons & rings">
          <p>{body.moons.note}</p>
          {moons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {moons.map((m) => (
                <MoonLink key={m.id} id={m.id} onNavigate={onNavigate} />
              ))}
            </div>
          )}
          <p className="mt-3"><span className="text-ink-400">Rings: </span>{body.rings}</p>
          <p className="mt-1.5"><span className="text-ink-400">Magnetic field: </span>{body.magneticField}</p>
        </Section>
      )}
      {body.kind === 'moon' && (
        <Section title="Magnetic field & phenomena">
          <p>{body.magneticField}</p>
        </Section>
      )}
      {body.phenomena.length > 0 && (
        <Section title="Notable phenomena">
          <Bullets items={body.phenomena} />
        </Section>
      )}
      {body.missions.length > 0 && (
        <Section title="Exploration">
          <ul className="space-y-3">
            {body.missions.map((m) => (
              <li key={m.name} className="flex gap-3">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${missionDot[m.status ?? 'past']}`} title={m.status} />
                <div>
                  <p className="text-ink-50">
                    {m.name} <span className="text-ink-400">· {m.agency} · {m.years}</span>
                  </p>
                  <p className="text-[12.5px] text-ink-400">{m.type} — {m.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Why it matters">
        <Bullets items={body.facts} />
      </Section>
      <Section title="Habitability">
        <p className="text-ink-50">{body.habitability.verdict}</p>
        {body.habitability.evidence.length > 0 && (
          <div className="mt-3">
            <p className="stat-label text-emerald-300/80">Evidence</p>
            <Bullets items={body.habitability.evidence} />
          </div>
        )}
        {body.habitability.speculation.length > 0 && (
          <div className="mt-3">
            <p className="stat-label text-flare-300/80">Hypotheses & open questions</p>
            <Bullets items={body.habitability.speculation} />
          </div>
        )}
      </Section>
      <Section title="Compared with Earth">
        <EarthComparison body={body} />
      </Section>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-400">{k}</span>
      <span className="text-right tabular-nums">{v}</span>
    </div>
  )
}

function MoonLink({ id, onNavigate }: { id: string; onNavigate?: (id: string) => void }) {
  const m = BODY_MAP[id]
  const inner = (
    <>
      <span className="h-2 w-2 rounded-full" style={{ background: m.accent }} />
      {m.name}
    </>
  )
  if (onNavigate)
    return (
      <button className="chip" onClick={() => onNavigate(id)}>
        {inner}
      </button>
    )
  return (
    <Link className="chip" to={`/encyclopedia/${id}`}>
      {inner}
    </Link>
  )
}
