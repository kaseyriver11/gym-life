import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
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

// Firestore rejects `undefined` field values outright (unlike `null`), so
// any optional field written as `x ?? undefined` would otherwise crash the
// write. Stripping those keys here means every call site can pass
// `undefined` for "not set" without thinking about it.
function omitUndefined(data: object): DocumentData {
  const result: DocumentData = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) result[key] = value
  }
  return result
}

// For updates (unlike creates) a caller passing `field: undefined` means
// "clear this field" — e.g. reopening a finished workout clears `endedAt`.
// updateDoc() needs the explicit deleteField() sentinel for that; simply
// omitting the key would leave the document's existing value untouched.
function toUpdatePayload(data: object): DocumentData {
  const result: DocumentData = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === undefined ? deleteField() : value
  }
  return result
}

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
    return addDoc(ref, omitUndefined(data))
  }

  async function update(id: string, data: Partial<T>) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, path, id)
    return updateDoc(ref, toUpdatePayload(data))
  }

  async function remove(id: string) {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, path, id)
    return deleteDoc(ref)
  }

  return { items, loading, add, update, remove }
}

/**
 * Subscribes to a top-level collection (not scoped under a user) in real
 * time — for shared, read-only data like the exercise catalog. Still
 * requires being signed in, matching rules of the form
 * `allow read: if request.auth != null`.
 */
export function useCollectionAt<T extends object>(
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
    const ref = collection(db, path)
    const q = query(ref, ...constraints)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) })))
        setLoading(false)
      },
      (err) => console.error('[useCollectionAt] error on', path, err),
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, path])

  return { items, loading }
}

export { orderBy, where }
export type { QueryConstraint }
