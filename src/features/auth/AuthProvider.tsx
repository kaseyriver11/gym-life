import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, use, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>
}

export function useAuth() {
  return use(AuthContext)
}
