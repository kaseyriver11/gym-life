import type { WorkoutSession } from '@/types'
import { isSetLogged } from './use-workout-sessions'

/** Epley-formula estimated one-rep max — the standard way apps compare
 * effort across different rep/weight combos for the same lift. */
export function estimatedOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

/** Best estimated 1RM ever logged for this exercise, across all sessions —
 * optionally excluding one session (e.g. the one currently being edited, so
 * its own sets can be compared against separately as they're logged).
 * Counts every really-logged set (see isSetLogged), whether or not the
 * completed toggle was tapped — but never an untouched greyed-out
 * suggestion, which would otherwise pass off a weight you were only
 * *offered* as a PR you actually hit. */
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
        if (!isSetLogged(set)) continue
        best = Math.max(best, estimatedOneRepMax(set.weight, set.reps))
      }
    }
  }
  return best
}
