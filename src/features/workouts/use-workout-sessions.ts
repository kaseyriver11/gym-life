import { useUserCollection } from '@/lib/use-collection'
import type { WorkoutSession, WorkoutSet } from '@/types'

export function useWorkoutSessions() {
  return useUserCollection<Omit<WorkoutSession, 'id'>>('workoutSessions')
}

/** Counts sets the way a lifter says it out loud — a left+right unilateral
 * pair is one set, not two. Mirrors LogTab's computeSetNumbers pairing so
 * every "X sets" readout in the app agrees with the per-set numbering shown
 * while actually logging. */
export function countSets(sets: { side?: 'left' | 'right' }[]): number {
  let count = 0
  let i = 0
  while (i < sets.length) {
    i += sets[i].side === 'left' && sets[i + 1]?.side === 'right' ? 2 : 1
    count += 1
  }
  return count
}

/** "Logged" means a real number was actually entered — not the separate
 * completed-toggle (a workout-flow gesture that starts the rest timer), and
 * not an untouched suggested/estimated value either. */
export function isSetLogged(s: Pick<WorkoutSet, 'isEstimate' | 'reps' | 'weight' | 'durationSeconds'>) {
  return !s.isEstimate && (s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0)
}

/** Shared by the dashboard's in-progress banner and the header's progress
 * pill so the two never drift out of sync on what "done" means. */
export function sessionSetProgress(session: Pick<WorkoutSession, 'entries'>) {
  const totalSets = session.entries.reduce((n, e) => n + countSets(e.sets), 0)
  const loggedSets = session.entries.reduce((n, e) => n + countSets(e.sets.filter(isSetLogged)), 0)
  return { totalSets, loggedSets }
}
