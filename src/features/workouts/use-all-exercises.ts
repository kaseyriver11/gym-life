import { useMemo } from 'react'
import type { Exercise } from '@/types'
import { useExerciseCatalog } from './use-exercise-catalog'
import { useExerciseNotes } from './use-exercise-notes'
import { useExercises } from './use-exercises'

export type ExerciseWithSource = Exercise & {
  source: 'catalog' | 'custom'
  /** Personal notes/angle, if any — from the user's own exerciseNotes,
   * never the shared catalog. */
  notes?: string
  /** Quick reminders, one per line, shown directly on the exercise card —
   * always personal, never part of the shared catalog. */
  cues?: string
  /** Per-user "off limits" marker (injury, doctor's orders, etc.) — 'forever',
   * an ISO expiry date, or unset. Always personal, works for catalog exercises
   * too, since it lives in exerciseNotes rather than the shared catalog. */
  restrictedUntil?: string | null
}

/**
 * Merges the shared catalog (read-only) with the signed-in user's personal
 * exercises into one pick-list. `add`/`update`/`remove` only ever touch the
 * personal collection — catalog exercises aren't editable from the app.
 * Also layers in per-user notes and muscle-target overrides (works for
 * catalog exercises too, since those live in a separate personalization
 * collection rather than mutating the exercise itself).
 */
export function useAllExercises() {
  const catalog = useExerciseCatalog()
  const personal = useExercises()
  const notes = useExerciseNotes()

  const items: ExerciseWithSource[] = useMemo(() => {
    function withNote(ex: Exercise, source: 'catalog' | 'custom'): ExerciseWithSource {
      const note = notes.byExerciseId[ex.id]
      return {
        ...ex,
        source,
        notes: note?.notes,
        cues: note?.cues,
        targetMuscles: note?.targetMuscles ?? ex.targetMuscles,
        restrictedUntil: note?.restrictedUntil,
        perSide: note?.perSide ?? ex.perSide,
      }
    }
    return [
      ...catalog.items.map((ex) => withNote(ex, 'catalog')),
      ...personal.items.map((ex) => withNote(ex, 'custom')),
    ]
  }, [catalog.items, personal.items, notes.byExerciseId])

  return {
    items,
    loading: catalog.loading || personal.loading,
    add: personal.add,
    update: personal.update,
    remove: personal.remove,
    saveNote: notes.save,
  }
}
