import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { useState } from 'react'
import { auth } from '@/lib/firebase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-950 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-900 p-6 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-neutral-50">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <div className="space-y-2">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-50 outline-none focus:border-indigo-500"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-50 outline-none focus:border-indigo-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="w-full text-center text-sm text-neutral-400 hover:text-neutral-200"
        >
          {mode === 'sign-in'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
