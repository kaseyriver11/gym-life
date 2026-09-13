import type { WorkoutSession } from '@/types'

const DEFAULT_REP_LOW = 8
const DEFAULT_REP_HIGH = 12

type ExerciseInfo = {
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
}

/**
 * Weight jump size for a "progress" decision, scaled to how forgiving the
 * lift actually is — a barbell squat and a dumbbell curl shouldn't move by
 * the same amount. Bodyweight movements progress via reps only.
 */
export function weightIncrement(equipment?: string, muscleGroup?: string): number {
  if (equipment === 'Bodyweight') return 0
  if (muscleGroup === 'Legs') return equipment === 'Barbell' ? 10 : 5
  if (equipment === 'Barbell') return 5
  return 2.5
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2
}

function findEntry(sessions: WorkoutSession[], exerciseId: string, skip = 0) {
  const matches = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.date.localeCompare(a.date))
  const session = matches[skip]
  return session?.entries.find((e) => e.exerciseId === exerciseId) ?? null
}

/**
 * Suggests this exercise's next sets using double progression (add reps
 * within a target range before adding weight) plus light autoregulation
 * (logged/inferred RPE and missed reps hold you back or trigger a deload)
 * instead of a blind flat weight bump. Falls back to one blank set if
 * there's no history at all.
 */
export function suggestSets(
  sessions: WorkoutSession[],
  exerciseId: string,
  exercise: ExerciseInfo = {},
): { reps: number; weight: number }[] {
  const last = findEntry(sessions, exerciseId)
  if (!last || last.sets.length === 0) {
    return [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }]
  }

  const completed = last.sets.filter((s) => s.completed)
  if (completed.length === 0) {
    return last.sets.map((s) => ({ reps: s.reps, weight: s.weight }))
  }

  const repLow = exercise.repRangeLow ?? DEFAULT_REP_LOW
  const repHigh = exercise.repRangeHigh ?? DEFAULT_REP_HIGH
  const increment = weightIncrement(exercise.equipment, exercise.muscleGroup)
  const baseWeight = completed[0].weight
  const bestReps = Math.max(...completed.map((s) => s.reps))

  const anyMissed = completed.some((s) => s.reps < repLow)
  const allHitTop = completed.every((s) => s.reps >= repHigh)
  const rated = completed.filter((s) => s.rpe != null)
  const avgRpe = rated.length ? rated.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rated.length : null
  const feltBrutal = avgRpe != null && avgRpe >= 9

  let targetWeight: number
  let targetReps: number

  if (anyMissed) {
    const prev = findEntry(sessions, exerciseId, 1)
    const prevCompleted = prev?.sets.filter((s) => s.completed) ?? []
    const prevAlsoMissed = prevCompleted.some((s) => s.reps < repLow)
    targetWeight =
      prevAlsoMissed && increment > 0 ? roundToHalf(baseWeight * 0.9) : baseWeight
    targetReps = repLow
  } else if (allHitTop && !feltBrutal) {
    targetWeight = baseWeight + increment
    targetReps = repLow
  } else {
    targetWeight = baseWeight
    targetReps = Math.min(repHigh, bestReps + 1)
  }

  return last.sets.map(() => ({ reps: targetReps, weight: targetWeight }))
}

/**
 * A reasonable RPE default to prefill when a set is marked complete, from
 * this session's own numbers — never forced, always editable.
 */
export function suggestDefaultRpe(
  reps: number,
  priorRepsThisSession: number[],
  repLow: number = DEFAULT_REP_LOW,
  repHigh: number = DEFAULT_REP_HIGH,
): number {
  if (reps < repLow) return 10
  if (priorRepsThisSession.length > 0) {
    const dropOff = Math.max(...priorRepsThisSession) - reps
    if (dropOff >= 3) return 9
    if (dropOff >= 1) return 8.5
  }
  if (reps >= repHigh) return 7.5
  return 8
}
