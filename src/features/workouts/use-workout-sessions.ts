import { useUserCollection } from '@/lib/use-collection'
import type { WorkoutSession } from '@/types'

export function useWorkoutSessions() {
  return useUserCollection<Omit<WorkoutSession, 'id'>>('workoutSessions')
}

/** "Logged" means a real number was actually entered — not the separate
 * completed-toggle (a workout-flow gesture that starts the rest timer), and
 * not an untouched suggested/estimated value either. Shared by the
 * dashboard's in-progress banner and the header's progress pill so the two
 * never drift out of sync on what "done" means. */
export function sessionSetProgress(session: Pick<WorkoutSession, 'entries'>) {
  const totalSets = session.entries.reduce((n, e) => n + e.sets.length, 0)
  const loggedSets = session.entries.reduce(
    (n, e) =>
      n +
      e.sets.filter((s) => !s.isEstimate && (s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0))
        .length,
    0,
  )
  return { totalSets, loggedSets }
}
