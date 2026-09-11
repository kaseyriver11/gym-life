import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { db } from '@/lib/firebase'

export interface RingTargets {
  steps: number
  water: number
  workoutsPerWeek: number
}

const DEFAULT_TARGETS: RingTargets = { steps: 10000, water: 64, workoutsPerWeek: 4 }

export function useDashboardPrefs() {
  const { user } = useAuth()
  const [hidden, setHiddenState] = useState<string[]>([])
  const [targets, setTargetsState] = useState<RingTargets>(DEFAULT_TARGETS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHiddenState([])
      setTargetsState(DEFAULT_TARGETS)
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', user.uid, 'settings', 'dashboard')
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data()
      setHiddenState(Array.isArray(data?.hidden) ? (data.hidden as string[]) : [])
      setTargetsState({ ...DEFAULT_TARGETS, ...(data?.targets as Partial<RingTargets>) })
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function setHidden(next: string[]) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'settings', 'dashboard')
    await setDoc(ref, { hidden: next }, { merge: true })
  }

  function toggle(key: string) {
    setHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key])
  }

  async function setTargets(next: Partial<RingTargets>) {
    if (!user) return
    const merged = { ...targets, ...next }
    setTargetsState(merged)
    const ref = doc(db, 'users', user.uid, 'settings', 'dashboard')
    await setDoc(ref, { targets: merged }, { merge: true })
  }

  return { hidden, targets, loading, toggle, setTargets }
}
