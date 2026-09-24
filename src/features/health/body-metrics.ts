import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import { useUserCollection } from '@/lib/use-collection'
import type { BodyCheck } from '@/types'

export interface Measurement {
  key: string
  label: string
}

/** Tape measurements, inches. Left/right limbs are separate — a lagging
 * side is exactly the kind of thing worth seeing. */
export const MEASUREMENTS: Measurement[] = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'armLeft', label: 'Arm (left)' },
  { key: 'armRight', label: 'Arm (right)' },
  { key: 'forearmLeft', label: 'Forearm (left)' },
  { key: 'forearmRight', label: 'Forearm (right)' },
  { key: 'thighLeft', label: 'Thigh (left)' },
  { key: 'thighRight', label: 'Thigh (right)' },
  { key: 'calfLeft', label: 'Calf (left)' },
  { key: 'calfRight', label: 'Calf (right)' },
]

export const DEFAULT_TRACKED = ['chest', 'waist', 'hips', 'armLeft', 'armRight', 'thighLeft', 'thighRight']

export function useBodyChecks() {
  return useUserCollection<Omit<BodyCheck, 'id'>>('bodyChecks')
}

/** One measurement's history, oldest first. `bodyFat` reads bodyFatPct. */
export function measurementHistory(checks: BodyCheck[], key: string): { date: string; value: number }[] {
  return checks
    .map((c) => ({ date: c.date, value: key === 'bodyFat' ? c.bodyFatPct : c.measurements[key] }))
    .filter((p): p is { date: string; value: number } => p.value != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ---------------------------------------------------------------------------
// Bodyweight trend

export interface WeightPoint {
  date: string
  weight: number
  /** Trailing 7-day average of the weigh-ins on or before this date. */
  avg: number
}

/** Daily weigh-ins plus a trailing 7-day average — day-to-day scale
 * readings swing a couple of pounds on water and food alone; the average
 * is what's actually moving. */
export function weightSeries(snapshots: { date: string; weightLbs?: number }[]): WeightPoint[] {
  const points = snapshots
    .filter((s): s is { date: string; weightLbs: number } => s.weightLbs != null && s.weightLbs > 0)
    .map((s) => ({ date: s.date, weight: s.weightLbs }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return points.map((p) => {
    const cutoff = format(subDays(parseISO(p.date), 6), 'yyyy-MM-dd')
    const window = points.filter((q) => q.date >= cutoff && q.date <= p.date)
    const avg = window.reduce((n, q) => n + q.weight, 0) / window.length
    return { ...p, avg: Math.round(avg * 10) / 10 }
  })
}

/** Average as of `date` (the last point on or before it). */
function avgAsOf(series: WeightPoint[], date: string): number | undefined {
  for (let i = series.length - 1; i >= 0; i--) if (series[i].date <= date) return series[i].avg
  return undefined
}

export interface WeightStats {
  current?: number
  avg?: number
  /** Change in the 7-day average vs. a week ago. */
  weekChange?: number
  /** Trend rate, lbs/week, from a least-squares fit over the last 4 weeks
   * of weigh-ins — steadier than any two readings. */
  ratePerWeek?: number
  /** Change in the average since `sinceDate` (e.g. a program start). */
  sinceChange?: number
}

export function weightStats(series: WeightPoint[], sinceDate?: string, today = new Date()): WeightStats {
  if (series.length === 0) return {}
  const last = series[series.length - 1]
  const todayISO = format(today, 'yyyy-MM-dd')
  // Only meaningful with a weigh-in on each side of the one-week mark.
  const weekAgoISO = format(subDays(today, 7), 'yyyy-MM-dd')
  const weekAgo = series.some((p) => p.date > weekAgoISO) ? avgAsOf(series, weekAgoISO) : undefined

  const recent = series.filter((p) => differenceInCalendarDays(today, parseISO(p.date)) <= 28)
  let ratePerWeek: number | undefined
  if (recent.length >= 4 && differenceInCalendarDays(parseISO(recent[recent.length - 1].date), parseISO(recent[0].date)) >= 10) {
    const xs = recent.map((p) => differenceInCalendarDays(parseISO(p.date), parseISO(recent[0].date)))
    const ys = recent.map((p) => p.weight)
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length
    const my = ys.reduce((a, b) => a + b, 0) / ys.length
    const num = xs.reduce((n, x, i) => n + (x - mx) * (ys[i] - my), 0)
    const den = xs.reduce((n, x) => n + (x - mx) ** 2, 0)
    if (den > 0) ratePerWeek = Math.round((num / den) * 7 * 10) / 10
  }

  const sinceBase = sinceDate ? (avgAsOf(series, sinceDate) ?? series.find((p) => p.date >= sinceDate)?.avg) : undefined
  const avgNow = avgAsOf(series, todayISO) ?? last.avg
  return {
    current: last.weight,
    avg: avgNow,
    weekChange: weekAgo != null ? Math.round((avgNow - weekAgo) * 10) / 10 : undefined,
    ratePerWeek,
    sinceChange: sinceBase != null ? Math.round((avgNow - sinceBase) * 10) / 10 : undefined,
  }
}

export function signed(n: number, unit = '') {
  return `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}${unit}`
}
