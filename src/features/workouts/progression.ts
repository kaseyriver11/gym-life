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
): { reps: number; weight: number; side?: 'left' | 'right' }[] {
  // Cardio is logged as one activity block (duration/distance/intensity),
  // never a rep/weight-style set count — always exactly one, regardless of
  // history or the sets-per-exercise picker.
  if (exercise.muscleGroup === 'Cardio') return [{ reps: 0, weight: 0 }]

  const last = findEntry(sessions, exerciseId)
  if (!last || last.sets.length === 0) {
    return [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }]
  }

  const completed = last.sets.filter((s) => s.completed)
  if (completed.length === 0) {
    return last.sets.map((s) => ({ reps: s.reps, weight: s.weight, side: s.side }))
  }

  const repLow = exercise.repRangeLow ?? DEFAULT_REP_LOW
  const repHigh = exercise.repRangeHigh ?? DEFAULT_REP_HIGH
  const increment = weightIncrement(exercise.equipment, exercise.muscleGroup)

  function target(completedForSide: typeof completed): { targetWeight: number; targetReps: number } {
    const baseWeight = completedForSide[0].weight
    const bestReps = Math.max(...completedForSide.map((s) => s.reps))
    const anyMissed = completedForSide.some((s) => s.reps < repLow)
    const allHitTop = completedForSide.every((s) => s.reps >= repHigh)
    const rated = completedForSide.filter((s) => s.rpe != null)
    const avgRpe = rated.length ? rated.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rated.length : null
    const feltBrutal = avgRpe != null && avgRpe >= 9

    if (anyMissed) {
      const prev = findEntry(sessions, exerciseId, 1)
      const prevCompleted = prev?.sets.filter((s) => s.completed) ?? []
      const prevAlsoMissed = prevCompleted.some((s) => s.reps < repLow)
      return {
        targetWeight: prevAlsoMissed && increment > 0 ? roundToHalf(baseWeight * 0.9) : baseWeight,
        targetReps: repLow,
      }
    }
    if (allHitTop && !feltBrutal) {
      return { targetWeight: baseWeight + increment, targetReps: repLow }
    }
    return { targetWeight: baseWeight, targetReps: Math.min(repHigh, bestReps + 1) }
  }

  // A unilateral exercise (left/right sets) progresses each side off its own
  // numbers — one side lagging shouldn't hold back (or get dragged along by)
  // the other, and losing the side tag entirely here is what made these
  // exercises render as flat, unpaired rows instead of an L/R split.
  const hasSides = last.sets.some((s) => s.side)
  if (hasSides) {
    // A side with nothing completed (skipped that day) has no numbers to
    // progress from — just carry its last logged reps/weight forward as-is
    // rather than crashing on an empty completed-sets array.
    function targetForSide(side: 'left' | 'right') {
      const completedForSide = completed.filter((s) => s.side === side)
      if (completedForSide.length > 0) return target(completedForSide)
      const lastForSide = last!.sets.filter((s) => s.side === side)
      const fallback = lastForSide[lastForSide.length - 1]
      return { targetWeight: fallback?.weight ?? 0, targetReps: fallback?.reps ?? 0 }
    }
    const left = targetForSide('left')
    const right = targetForSide('right')
    return last.sets.map((s) => {
      const t = s.side === 'right' ? right : left
      return { reps: t.targetReps, weight: t.targetWeight, side: s.side }
    })
  }

  const { targetWeight, targetReps } = target(completed)
  return last.sets.map(() => ({ reps: targetReps, weight: targetWeight }))
}

/**
 * Applies an explicit "sets per exercise" override from the compose-workout
 * picker on top of suggestSets' usual result — trims extra sets, or pads
 * with the last suggested set's numbers (so the added ones aren't blank)
 * when the override asks for more than was suggested. No-op when unset.
 */
export function applySetsOverride(
  suggested: { reps: number; weight: number }[],
  count?: number,
): { reps: number; weight: number }[] {
  if (!count || count === suggested.length) return suggested
  if (count < suggested.length) return suggested.slice(0, count)
  const last = suggested[suggested.length - 1] ?? { reps: 0, weight: 0 }
  return [...suggested, ...Array.from({ length: count - suggested.length }, () => ({ ...last }))]
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
