import { useCollectionAt } from '@/lib/use-collection'
import type { Exercise } from '@/types'

/** The shared, research-backed exercise catalog — read-only from the app. */
export function useExerciseCatalog() {
  return useCollectionAt<Omit<Exercise, 'id'>>('exerciseCatalog')
}
