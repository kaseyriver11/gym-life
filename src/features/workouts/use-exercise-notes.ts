import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { db } from '@/lib/firebase'
import type { MuscleTarget } from '@/types'

export interface ExerciseNote {
  /** Personal technique/angle notes — e.g. "elbows tucked, pause at chest". */
  notes?: string
  /** Overrides the exercise's shared targetMuscles just for this user,
   * without touching the shared catalog or any other user's view of it. */
  targetMuscles?: MuscleTarget[]
  /** 'forever', an ISO yyyy-MM-dd expiry date, or null/absent when not
   * restricted. Firestore is initialized with ignoreUndefinedProperties, so
   * clearing this must write `null` (not `undefined`) or the field is left
   * untouched instead of cleared. */
  restrictedUntil?: string | null
  updatedAt: number
}

/**
 * Per-user personalization keyed directly by exerciseId (not an auto-id
 * collection) so lookups are O(1) and a user can only ever have one
 * customization per exercise, catalog or custom.
 */
export function useExerciseNotes() {
  const { user } = useAuth()
  const [byExerciseId, setByExerciseId] = useState<Record<string, ExerciseNote>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setByExerciseId({})
      setLoading(false)
      return
    }
    const ref = collection(db, 'users', user.uid, 'exerciseNotes')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const next: Record<string, ExerciseNote> = {}
      for (const d of snapshot.docs) next[d.id] = d.data() as ExerciseNote
      setByExerciseId(next)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function save(exerciseId: string, data: Partial<Omit<ExerciseNote, 'updatedAt'>>) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, 'exerciseNotes', exerciseId)
    await setDoc(ref, { ...data, updatedAt: Date.now() }, { merge: true })
  }

  return { byExerciseId, loading, save }
}
