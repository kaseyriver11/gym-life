import type { WorkoutExerciseEntry, WorkoutSession } from '@/types'
import { estimatedOneRepMax } from './prs'

/**
 * Strength relative to bodyweight — the standard way lifters compare
 * themselves across time even as bodyweight changes (e.g. "1.5x bodyweight
 * bench"). Using this instead of raw weight/e1RM means losing weight while
 * holding the same numbers reads as "held steady," never as decline —
 * exactly the gap the raw "10 reps at 40 lbs" view can't see.
 */
export function relativeStrength(oneRepMax: number, bodyweightLbs: number): number {
  if (bodyweightLbs <= 0) return 0
  return oneRepMax / bodyweightLbs
}

/**
 * A single per-session index meant for tracking trend over time — not an
 * absolute strength standard, and not comparable between different users.
 * Combines, per completed strength set (cardio excluded):
 *  - relative strength (e1RM ÷ bodyweight) so lifting the same weight at a
 *    lower bodyweight never reads as weaker.
 *  - total volume (reps × weight ÷ bodyweight) so higher-rep, non-maximal
 *    work still counts for something rather than only your single best lift
 *    mattering.
 *  - a late-workout bonus — a strong set held up deep into the session
 *    (a later exercise, or a later set within it) reflects more real
 *    strength/endurance than the same numbers on your very first, freshest
 *    set, so it's weighted slightly higher.
 */
export function sessionStrengthScore(
  entries: WorkoutExerciseEntry[],
  exercisesById: Map<string, { muscleGroup?: string } | undefined>,
  bodyweightLbs: number,
): number {
  if (bodyweightLbs <= 0 || entries.length === 0) return 0
  let score = 0

  entries.forEach((entry, entryIndex) => {
    const info = exercisesById.get(entry.exerciseId)
    if (info?.muscleGroup === 'Cardio') return

    entry.sets.forEach((set, setIndex) => {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) return
      const oneRm = estimatedOneRepMax(set.weight, set.reps)
      const positionIntoWorkout =
        (entryIndex + (setIndex + 1) / (entry.sets.length + 1)) / entries.length
      const lateWorkoutBonus = 1 + 0.25 * positionIntoWorkout

      const volumePoints = (set.reps * set.weight) / bodyweightLbs
      const intensityPoints = relativeStrength(oneRm, bodyweightLbs) * 10
      score += (volumePoints * 0.3 + intensityPoints * 0.7) * lateWorkoutBonus
    })
  })

  return Math.round(score * 10) / 10
}

/** Finds the bodyweight reading closest to (on or before, else nearest
 * after) a given session date — sessions rarely land exactly on a weigh-in,
 * so this is the practical way to normalize each session's score against
 * what the user actually weighed around that time. */
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

/** Per-session strength-score trend, each point normalized against the
 * bodyweight closest to that session's date rather than today's weight. */
export function strengthScoreTrend(
  sessions: WorkoutSession[],
  exercisesById: Map<string, { muscleGroup?: string } | undefined>,
  snapshots: { date: string; weightLbs?: number }[],
): { date: string; score: number }[] {
  return sessions
    .map((session) => {
      const bw = bodyweightNear(snapshots, session.date)
      if (!bw) return null
      const score = sessionStrengthScore(session.entries, exercisesById, bw)
      if (score <= 0) return null
      return { date: session.date, score }
    })
    .filter((d): d is { date: string; score: number } => d !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
