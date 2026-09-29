import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { db } from '@/lib/firebase'

/** Per-user workout settings (users/{uid}/settings/workout). */
export function useWorkoutPrefs() {
  const { user } = useAuth()
  // On unless turned off — the rest countdown starting after each set is
  // the default experience.
  const [restTimerAuto, setRestTimerAutoState] = useState(true)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'settings', 'workout')
    return onSnapshot(ref, (snap) => {
      setRestTimerAutoState(snap.data()?.restTimerAuto !== false)
    })
  }, [user])

  async function setRestTimerAuto(next: boolean) {
    setRestTimerAutoState(next)
    if (!user) return
    await setDoc(doc(db, 'users', user.uid, 'settings', 'workout'), { restTimerAuto: next }, { merge: true })
  }

  return { restTimerAuto, setRestTimerAuto }
}
