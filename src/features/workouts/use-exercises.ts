import { useUserCollection } from '@/lib/use-collection'
import type { Exercise } from '@/types'

export function useExercises() {
  return useUserCollection<Omit<Exercise, 'id'>>('exercises')
}
