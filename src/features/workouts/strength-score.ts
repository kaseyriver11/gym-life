import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { WorkoutSession } from '@/types'
import { isDurationBased } from './muscle-groups'
import { estimatedOneRepMax } from './prs'
import { isSetLogged } from './use-workout-sessions'

/** Finds the bodyweight reading closest to (on or before, else nearest
 * after) a given session date — sessions rarely land exactly on a weigh-in,
 * so this is the practical way to normalize each session against what the
 * user actually weighed around that time. */
export function bodyweightNear(
  snapshots: { date: string; weightLbs?: number }[],
  date: string,
): number | undefined {
  const withWeight = snapshots.filter((s) => s.weightLbs != null)
  if (withWeight.length === 0) return undefined
  const onOrBefore = withWeight.filter((s) => s.date <= date).sort((a, b) => b.date.localeCompare(a.date))
  if (onOrBefore.length > 0) return onOrBefore[0].weightLbs
  const after = withWeight.filter((s) => s.date > date).sort((a, b) => a.date.localeCompare(b.date))
  return after[0]?.weightLbs
}

/** Epley gets unreliable past ~12 reps — a 25-rep set says little about a
 * max — so only sets in a strength-relevant rep range feed the index. */
const MAX_REPS_FOR_INDEX = 12
/** An exercise you haven't done in this long stops counting toward the
 * index, rather than freezing its last value in forever. */
const STALE_AFTER_DAYS = 90
/** One lift's change is capped to this band before averaging. Real
 * progress rarely exceeds it, but a switched machine or attachment (same
 * exercise name, very different weight scale) easily does — and would
 * otherwise hijack the whole index. */
const MIN_RATIO = 0.5
const MAX_RATIO = 2

export interface StrengthIndexPoint {
  date: string
  /** 100 = where you started; 110 = 10% stronger on average. */
  index: number
  /** How many exercises (logged 2+ times) contributed to this point. */
  exercises: number
}

/**
 * A strength index that isn't fooled by session size or split.
 *
 * Each exercise is measured only against itself: its best estimated 1RM
 * per session, divided by your bodyweight at the time (when you've logged
 * any), relative to the first time you logged it. The index on a date is
 * the geometric mean of those ratios (capped to 0.5x-2x each) across every
 * exercise logged at least twice and trained in the last 90 days, each
 * carried forward at its latest value — so an arm day doesn't "lose" your
 * squat, a 30-set session doesn't count more than a 12-set one, and one
 * odd lift can't swing the whole thing. Geometric, because these are
 * ratios: +10% then -10% should net out near zero, not drift upward.
 *
 * Without any bodyweight logged it falls back to absolute strength (e1RM
 * alone); with it, getting lighter while holding your lifts reads as
 * stronger, which it is.
 */
export function strengthIndexTrend(
  sessions: WorkoutSession[],
  exercisesById: Map<string, { muscleGroup?: string; equipment?: string } | undefined>,
  snapshots: { date: string; weightLbs?: number }[],
): { points: StrengthIndexPoint[]; relative: boolean } {
  const relative = snapshots.some((s) => s.weightLbs != null)
  // exerciseId -> date -> best (relative) e1RM that day
  const byExercise = new Map<string, Map<string, number>>()

  for (const session of sessions) {
    const bw = bodyweightNear(snapshots, session.date)
    for (const entry of session.entries) {
      const info = exercisesById.get(entry.exerciseId)
      if (isDurationBased(info?.muscleGroup)) continue
      const isBodyweight = info?.equipment === 'Bodyweight'
      let best = 0
      for (const set of entry.sets) {
        if (!isSetLogged(set) || set.reps <= 0 || set.reps > MAX_REPS_FOR_INDEX) continue
        // Bodyweight moves: the load is you (+ anything added).
        const load = isBodyweight ? (bw ?? 0) + set.weight : set.weight
        best = Math.max(best, estimatedOneRepMax(load, set.reps))
      }
      if (best <= 0) continue
      const value = relative && bw ? best / bw : best
      const days = byExercise.get(entry.exerciseId) ?? new Map<string, number>()
      days.set(session.date, Math.max(days.get(session.date) ?? 0, value))
      byExercise.set(entry.exerciseId, days)
    }
  }

  const series = [...byExercise.values()].map((days) =>
    [...days.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date)),
  )
  const dates = [...new Set(series.flatMap((s) => s.map((p) => p.date)))].sort()

  const points: StrengthIndexPoint[] = []
  for (const date of dates) {
    const ratios: number[] = []
    for (const s of series) {
      const seen = s.filter((p) => p.date <= date)
      // Needs a second session to have anything to compare against.
      if (seen.length < 2) continue
      const latest = seen[seen.length - 1]
      if (differenceInCalendarDays(parseISO(date), parseISO(latest.date)) > STALE_AFTER_DAYS) continue
      ratios.push(Math.min(MAX_RATIO, Math.max(MIN_RATIO, latest.value / seen[0].value)))
    }
    if (ratios.length === 0) continue
    const index = Math.exp(ratios.reduce((a, b) => a + Math.log(b), 0) / ratios.length) * 100
    points.push({ date, index: Math.round(index * 10) / 10, exercises: ratios.length })
  }
  return { points, relative }
}
