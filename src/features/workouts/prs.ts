import type { WorkoutSession } from '@/types'

/** Epley-formula estimated one-rep max — the standard way apps compare
 * effort across different rep/weight combos for the same lift. */
export function estimatedOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

/** Best estimated 1RM ever logged for this exercise, across all sessions —
 * optionally excluding one session (e.g. the one currently being edited, so
 * its own sets can be compared against separately as they're logged). */
export function bestEstimatedOneRepMax(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): number {
  let best = 0
  for (const session of sessions) {
    if (session.id === excludeSessionId) continue
    for (const entry of session.entries) {
      if (entry.exerciseId !== exerciseId) continue
      for (const set of entry.sets) {
        if (!set.completed) continue
        best = Math.max(best, estimatedOneRepMax(set.weight, set.reps))
      }
    }
  }
  return best
}

/**
 * Same as `bestEstimatedOneRepMax` but counts any set with real reps/weight
 * logged, regardless of whether it's marked "completed" — for summary/
 * history views comparing effort across sessions where a user reliably
 * enters numbers but doesn't always tap the completed toggle.
 */
export function bestEstimatedOneRepMaxAnySet(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): number {
  let best = 0
  for (const session of sessions) {
    if (session.id === excludeSessionId) continue
    for (const entry of session.entries) {
      if (entry.exerciseId !== exerciseId) continue
      for (const set of entry.sets) {
        best = Math.max(best, estimatedOneRepMax(set.weight, set.reps))
      }
    }
  }
  return best
}
