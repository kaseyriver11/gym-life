import { doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Exercise } from '@/types'
import { FORM_CUES } from './form-cues'

/** Catalog doc id for an exercise name — also how built-in routines refer
 * to catalog exercises without a lookup. */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Writes catalog exercises with deterministic ids (slug of the name), so
 * re-running this is safe — it overwrites the same docs rather than
 * creating duplicates.
 */
export async function seedCatalog(exercises: Omit<Exercise, 'id'>[]) {
  const batch = writeBatch(db)
  for (const exercise of exercises) {
    const id = slugify(exercise.name)
    const formCues = FORM_CUES[exercise.name]
    batch.set(doc(db, 'exerciseCatalog', id), formCues ? { ...exercise, formCues } : exercise)
  }
  await batch.commit()
  return exercises.length
}
