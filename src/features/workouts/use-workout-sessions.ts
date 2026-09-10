import { useUserCollection } from '@/lib/use-collection'
import type { WorkoutSession } from '@/types'

export function useWorkoutSessions() {
  return useUserCollection<Omit<WorkoutSession, 'id'>>('workoutSessions')
}
