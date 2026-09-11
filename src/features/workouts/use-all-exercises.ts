import { useMemo } from 'react'
import type { Exercise } from '@/types'
import { useExerciseCatalog } from './use-exercise-catalog'
import { useExercises } from './use-exercises'

export type ExerciseWithSource = Exercise & { source: 'catalog' | 'custom' }

/**
 * Merges the shared catalog (read-only) with the signed-in user's personal
 * exercises into one pick-list. `add`/`update`/`remove` only ever touch the
 * personal collection — catalog exercises aren't editable from the app.
 */
export function useAllExercises() {
  const catalog = useExerciseCatalog()
  const personal = useExercises()

  const items: ExerciseWithSource[] = useMemo(
    () => [
      ...catalog.items.map((ex) => ({ ...ex, source: 'catalog' as const })),
      ...personal.items.map((ex) => ({ ...ex, source: 'custom' as const })),
    ],
    [catalog.items, personal.items],
  )

  return {
    items,
    loading: catalog.loading || personal.loading,
    add: personal.add,
    update: personal.update,
    remove: personal.remove,
  }
}
