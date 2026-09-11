import { useUserCollection } from '@/lib/use-collection'
import type { WorkoutTemplate } from '@/types'

export function useWorkoutTemplates() {
  return useUserCollection<Omit<WorkoutTemplate, 'id'>>('workoutTemplates')
}
