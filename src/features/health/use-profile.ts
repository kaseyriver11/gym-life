import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

const EMPTY: UserProfile = {}

/** Age/height/sex, used only to personalize workout calorie estimates
 * (see calories.ts) — optional everywhere downstream, so leaving this
 * unset just falls back to a plain weight-based estimate. */
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfileState] = useState<UserProfile>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfileState(EMPTY)
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', user.uid, 'settings', 'profile')
    const unsubscribe = onSnapshot(ref, (snap) => {
      setProfileState((snap.data() as UserProfile | undefined) ?? EMPTY)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function setProfile(patch: Partial<UserProfile>) {
    if (!user) return
    const merged = { ...profile, ...patch }
    setProfileState(merged)
    const ref = doc(db, 'users', user.uid, 'settings', 'profile')
    await setDoc(ref, merged, { merge: true })
  }

  return { profile, loading, setProfile }
}
