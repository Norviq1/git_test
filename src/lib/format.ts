const nf = (d = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 })

export const fmt = (n: number, d = 0) => nf(d).format(n)

export function fmtSci(n: number, unit = '') {
  if (n === 0) return `0${unit}`
  const exp = Math.floor(Math.log10(Math.abs(n)))
  const mant = n / Math.pow(10, exp)
  const sup = String(exp).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] ?? (c === '-' ? '⁻' : c)).join('')
  return `${mant.toFixed(2)} × 10${sup}${unit}`
}

export function fmtDuration(hours: number) {
  const h = Math.abs(hours)
  if (h < 48) {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return mm ? `${hh} h ${mm} min` : `${hh} h`
  }
  const days = h / 24
  if (days < 1000) return `${fmt(days, days < 10 ? 2 : 1)} Earth days`
  return `${fmt(days / 365.25, 1)} Earth years`
}

export function fmtPeriodDays(days: number) {
  if (days < 2) return fmtDuration(days * 24)
  if (days < 800) return `${fmt(days, days < 30 ? 2 : 1)} days`
  return `${fmt(days / 365.25, days > 36525 ? 0 : 2)} years`
}

export function fmtKm(km: number) {
  if (km >= 1e9) return `${fmt(km / 1e9, 2)} billion km`
  if (km >= 1e6) return `${fmt(km / 1e6, 1)} million km`
  return `${fmt(km)} km`
}

export const fmtTemp = (c: number) => `${c > 0 ? '' : ''}${fmt(c)} °C`

export function fmtRatio(x: number) {
  if (x >= 100) return `${fmt(x)}×`
  if (x >= 10) return `${fmt(x, 1)}×`
  if (x >= 0.01) return `${fmt(x, 2)}×`
  return `${x.toPrecision(2)}×`
}

export function fmtLightTime(km: number) {
  const s = km / 299_792.458
  if (s < 60) return `${fmt(s, 1)} light-seconds`
  if (s < 3600) return `${fmt(s / 60, 1)} light-minutes`
  return `${fmt(s / 3600, 2)} light-hours`
}
