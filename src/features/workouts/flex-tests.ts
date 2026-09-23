import { useUserCollection } from '@/lib/use-collection'
import type { FlexCheck, WorkoutSession } from '@/types'
import { isHoldBased } from './muscle-groups'
import { cardioWeeks, type ExerciseInfo } from './progress-stats'
import { isSetLogged } from './use-workout-sessions'

/** Simple at-home flexibility benchmarks, re-tested every few weeks to see
 * whether mobility work is actually moving the needle. */
export interface FlexTest {
  key: string
  label: string
  unit: 'in' | 's'
  /** false = smaller is better (e.g. the gap between hands behind the back). */
  higherIsBetter: boolean
  how: string
}

export const FLEX_TESTS: FlexTest[] = [
  {
    key: 'toeTouch',
    label: 'Toe touch',
    unit: 'in',
    higherIsBetter: true,
    how: 'Stand, knees straight, reach down. Inches past your toes (+) or short of them (−).',
  },
  {
    key: 'deepSquat',
    label: 'Deep squat hold',
    unit: 's',
    higherIsBetter: true,
    how: 'Heels down, as deep as you can go comfortably. How long can you hold it?',
  },
  {
    key: 'shoulderLeft',
    label: 'Shoulder reach (left on top)',
    unit: 'in',
    higherIsBetter: false,
    how: 'Left hand over your shoulder, right hand up your back. Gap between fingertips — negative if they overlap.',
  },
  {
    key: 'shoulderRight',
    label: 'Shoulder reach (right on top)',
    unit: 'in',
    higherIsBetter: false,
    how: 'Right hand over your shoulder, left hand up your back. Gap between fingertips — negative if they overlap.',
  },
  {
    key: 'ankleLeft',
    label: 'Knee-to-wall (left)',
    unit: 'in',
    higherIsBetter: true,
    how: 'Left toes this far from a wall while the knee still touches it, heel flat.',
  },
  {
    key: 'ankleRight',
    label: 'Knee-to-wall (right)',
    unit: 'in',
    higherIsBetter: true,
    how: 'Right toes this far from a wall while the knee still touches it, heel flat.',
  },
]

export function useFlexChecks() {
  return useUserCollection<Omit<FlexCheck, 'id'>>('flexChecks')
}

/** Per-test history, oldest first. */
export function flexTestHistory(checks: FlexCheck[], key: string): { date: string; value: number }[] {
  return checks
    .filter((c) => c.results[key] != null)
    .map((c) => ({ date: c.date, value: c.results[key] }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Minutes of stretching/mobility/yoga per Sun-Sat week — really-logged
 * holds only. Reuses the cardio week bucketing. */
export function mobilityWeeks(
  sessions: WorkoutSession[],
  exercisesById: Map<string, ExerciseInfo>,
  weeks = 8,
) {
  const blocks = sessions.flatMap((s) =>
    s.entries
      .filter((e) => isHoldBased(exercisesById.get(e.exerciseId)?.muscleGroup))
      .map((e) => ({
        date: s.date,
        exerciseId: e.exerciseId,
        activity: e.exerciseName,
        seconds: e.sets.filter(isSetLogged).reduce((n, set) => n + (set.durationSeconds ?? 0), 0),
        miles: 0,
      }))
      .filter((b) => b.seconds > 0),
  )
  return { weeks: cardioWeeks(blocks, weeks), blocks }
}
