import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { db } from '@/lib/firebase'

/**
 * Subscribes to `users/{uid}/{path}` in real time and exposes CRUD helpers.
 * `T` should NOT include `id` — it's attached from the doc id.
 */
export function useUserCollection<T extends object>(
  path: string,
  constraints: QueryConstraint[] = [],
) {
  const { user } = useAuth()
  const [items, setItems] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    const ref = collection(db, 'users', user.uid, path)
    const q = query(ref, ...constraints)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) })),
      )
      setLoading(false)
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, path])

  async function add(data: T) {
    if (!user) throw new Error('Not signed in')
    const ref = collection(db, 'users', user.uid, path)
    return addDoc(ref, data as DocumentData)
  }

  async function update(id: string, data: Partial<T>) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, path, id)
    return updateDoc(ref, data as DocumentData)
  }

  async function remove(id: string) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, path, id)
    return deleteDoc(ref)
  }

  return { items, loading, add, update, remove }
}

export { orderBy, where }
export type { QueryConstraint }
