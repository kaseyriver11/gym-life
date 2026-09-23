import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWorkoutSessions } from '@/features/workouts/use-workout-sessions'
import { fetchRecentWorkouts, isHealthConnectLinked, type HealthWorkout } from './health-connect'
import { importedKeys, isImportable, loadDismissed, workoutKey } from './health-import'

// One Health Connect query per few minutes app-wide, not one per tab switch.
let cache: { at: number; workouts: HealthWorkout[]; dismissed: Set<string> } | null = null
const CACHE_MS = 5 * 60 * 1000

/** Recent watch workouts that aren't logged here yet (and weren't dismissed). */
export function useImportCandidates() {
  const { items: sessions, loading } = useWorkoutSessions()
  const [linked, setLinked] = useState(false)
  const [raw, setRaw] = useState(cache)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (force = false) => {
    if (!(await isHealthConnectLinked())) return
    setLinked(true)
    if (!force && cache && Date.now() - cache.at < CACHE_MS) {
      setRaw(cache)
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const [workouts, dismissed] = await Promise.all([fetchRecentWorkouts(14), loadDismissed()])
      cache = { at: Date.now(), workouts, dismissed }
      setRaw(cache)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read workouts from Health Connect.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off an async fetch
    refresh()
  }, [refresh])

  const { candidates, skippedCount } = useMemo(() => {
    if (!raw || loading) return { candidates: [], skippedCount: 0 }
    const done = importedKeys(sessions)
    const fresh = raw.workouts.filter((w) => !done.has(workoutKey(w)) && !raw.dismissed.has(workoutKey(w)))
    return {
      candidates: fresh.filter(isImportable).sort((a, b) => b.startDate.localeCompare(a.startDate)),
      skippedCount: fresh.filter((w) => !isImportable(w)).length,
    }
  }, [raw, sessions, loading])

  function forget(keys: string[]) {
    if (!cache) return
    for (const k of keys) cache.dismissed.add(k)
    setRaw({ ...cache })
  }

  return { linked, candidates, skippedCount, status, error, refresh, forget }
}
