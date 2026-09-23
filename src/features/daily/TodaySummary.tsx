import clsx from 'clsx'
import { Dumbbell, Flame, Footprints, HeartPulse } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHealthSnapshots } from '@/features/health/use-health'
import { useProfile } from '@/features/health/use-profile'
import { estimateSessionCalories } from '@/features/workouts/calories'
import { useAllExercises } from '@/features/workouts/use-all-exercises'
import { sessionSetProgress, useWorkoutSessions } from '@/features/workouts/use-workout-sessions'

/** A quick "what happened this day" rollup — workout progress, cardio,
 * steps, calories — for whichever date Today's own date nav has selected.
 * Pulls from data that already lives elsewhere (session progress, health
 * snapshots) rather than owning any of it; tapping the workout/cardio tiles
 * just links back into the Gym tab, which stays the one place you actually
 * log a set. Renders nothing on a day with no workout and no health data
 * logged, so it never sits there as a wall of empty stats. */
export function TodaySummary({ date }: { date: string }) {
  const { items: sessions } = useWorkoutSessions()
  const { items: exercises } = useAllExercises()
  const { items: healthSnapshots } = useHealthSnapshots()
  const { profile } = useProfile()

  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])
  const session = sessions.find((s) => s.date === date)
  const snapshot = healthSnapshots.find((s) => s.date === date)
  // Closest weigh-in on or before this date — the same "personalize the
  // estimate if we can, fall back gracefully if not" approach used
  // wherever else calories get estimated.
  const weightLbs = useMemo(() => {
    const withWeight = [...healthSnapshots]
      .filter((s) => s.weightLbs != null && s.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))
    return withWeight[0]?.weightLbs
  }, [healthSnapshots, date])

  const hasWorkout = !!session && session.entries.length > 0
  const { totalSets, loggedSets } = hasWorkout
    ? sessionSetProgress(session)
    : { totalSets: 0, loggedSets: 0 }
  const finished = hasWorkout && totalSets > 0 && loggedSets === totalSets

  const cardioSeconds =
    session?.entries
      .filter((e) => exercisesById.get(e.exerciseId)?.muscleGroup === 'Cardio')
      .reduce((sum, e) => sum + e.sets.reduce((s, set) => s + (set.durationSeconds ?? 0), 0), 0) ?? 0

  const calories =
    hasWorkout && weightLbs ? estimateSessionCalories(session, exercisesById, weightLbs, profile) : null

  const tiles: { key: string; icon: typeof Dumbbell; label: string; value: string; to?: string }[] = []
  if (hasWorkout) {
    tiles.push({
      key: 'workout',
      icon: Dumbbell,
      label: finished ? 'Workout done' : 'Workout',
      value: `${loggedSets}/${totalSets} sets`,
      to: '/workouts',
    })
  }
  if (cardioSeconds > 0) {
    tiles.push({
      key: 'cardio',
      icon: HeartPulse,
      label: 'Cardio',
      value: `${Math.round(cardioSeconds / 60)} min`,
      to: '/workouts',
    })
  }
  if (snapshot?.steps != null) {
    tiles.push({
      key: 'steps',
      icon: Footprints,
      label: 'Steps',
      value: snapshot.steps.toLocaleString(),
    })
  }
  if (calories != null && calories > 0) {
    tiles.push({ key: 'calories', icon: Flame, label: 'Calories', value: `~${calories} cal` })
  }

  if (tiles.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((tile) => {
        const Icon = tile.icon
        const content = (
          <>
            <Icon size={16} className="shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="truncate text-xs text-neutral-500">{tile.label}</p>
              <p className="truncate text-sm font-semibold text-neutral-100">{tile.value}</p>
            </div>
          </>
        )
        const className =
          'flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5'
        return tile.to ? (
          <Link key={tile.key} to={tile.to} className={clsx(className, 'hover:border-indigo-500/60')}>
            {content}
          </Link>
        ) : (
          <div key={tile.key} className={className}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
