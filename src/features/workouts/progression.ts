import type { WorkoutSession } from '@/types'
import { isDurationBased } from './muscle-groups'
import { isSetLogged } from './use-workout-sessions'

const DEFAULT_REP_LOW = 8
const DEFAULT_REP_HIGH = 12

type ExerciseInfo = {
  name?: string
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
}

// "Single-Arm ..." / "Single Leg ..." / "1-Arm ..." is, by definition, one
// limb at a time — force an L/R split from the exercise's name itself
// rather than waiting for history to happen to have been logged that way
// (or requiring a separate catalog flag that's easy to forget to set).
// Hyphen is optional since custom exercises typed by hand rarely bother
// with it ("Single Leg Glute Bridge" is exactly as unilateral as
// "Single-Leg Glute Bridge").
const UNILATERAL_NAME_PATTERN = /\b(single|1)[\s-](arm|leg)\b/i

function isUnilateralByName(name?: string): boolean {
  return !!name && UNILATERAL_NAME_PATTERN.test(name)
}

/**
 * Expands flat planned/suggested sets into left+right pairs when the
 * exercise's name says it's unilateral and they aren't already side-tagged.
 * A saved template's own planned reps/weight (typed in directly via
 * TemplateBuilder) never carries side data — only suggestSets' own
 * generated output does — so starting/importing a template used its
 * planned numbers completely unaware an exercise like "Single-Leg Glute
 * Bridge" needed splitting at all, rendering flat unpaired sets even
 * though the exercise is unmistakably unilateral by name. Exported so
 * PlanTab/LogTab can apply the same rule wherever a template's planned
 * sets turn into real session sets.
 */
export function applyUnilateralSplit<T extends { reps: number; weight: number; side?: 'left' | 'right' }>(
  sets: T[],
  exerciseName?: string,
): (Omit<T, 'side'> & { side?: 'left' | 'right' })[] {
  if (!isUnilateralByName(exerciseName) || sets.some((s) => s.side)) return sets
  return sets.flatMap((s) => [
    { ...s, side: 'left' as const },
    { ...s, side: 'right' as const },
  ])
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
  // Dumbbells/kettlebells in most gyms only come in 5lb jumps — a 2.5lb step
  // (fine for cable/machine stacks) would recommend weights nobody owns.
  if (equipment === 'Dumbbell' || equipment === 'Kettlebell') return 5
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
  // Cardio/Yoga/Pilates are logged by duration, never a rep/weight-style
  // set count — always exactly one activity/pose block, regardless of
  // history or the sets-per-exercise picker. No weight-based progression
  // for these either; hold-time progression isn't modeled yet.
  if (isDurationBased(exercise.muscleGroup)) return [{ reps: 0, weight: 0 }]

  const forceUnilateral = isUnilateralByName(exercise.name)
  const last = findEntry(sessions, exerciseId)
  if (!last || last.sets.length === 0) {
    if (forceUnilateral) {
      return Array.from({ length: 3 }).flatMap(
        () =>
          [
            { reps: 0, weight: 0, side: 'left' },
            { reps: 0, weight: 0, side: 'right' },
          ] as const,
      )
    }
    return [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }]
  }

  // "Performed" = really logged (isSetLogged), same as every stat in the
  // app — typing the numbers in counts even if the completed toggle was
  // never tapped, and an untouched suggestion never does.
  const completed = last.sets.filter(isSetLogged)
  if (completed.length === 0) {
    if (forceUnilateral && !last.sets.some((s) => s.side)) {
      return last.sets.flatMap((s) => [
        { reps: s.reps, weight: s.weight, side: 'left' as const },
        { reps: s.reps, weight: s.weight, side: 'right' as const },
      ])
    }
    return last.sets.map((s) => ({ reps: s.reps, weight: s.weight, side: s.side }))
  }

  const repLow = exercise.repRangeLow ?? DEFAULT_REP_LOW
  const repHigh = exercise.repRangeHigh ?? DEFAULT_REP_HIGH
  const increment = weightIncrement(exercise.equipment, exercise.muscleGroup)
  const isDumbbellLike = exercise.equipment === 'Dumbbell' || exercise.equipment === 'Kettlebell'

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
      const prevCompleted = prev?.sets.filter(isSetLogged) ?? []
      const prevAlsoMissed = prevCompleted.some((s) => s.reps < repLow)
      const deload = prevAlsoMissed && increment > 0 ? roundToHalf(baseWeight * 0.9) : baseWeight
      return {
        // A deload off a "clean" dumbbell/kettlebell weight (a multiple of
        // 5) should land on another weight that actually exists on the
        // rack — but if the logged weight itself wasn't a multiple of 5,
        // that's the user telling us they have finer-grained plates, so
        // leave their own precision alone.
        targetWeight: isDumbbellLike && baseWeight % 5 === 0 ? Math.round(deload / 5) * 5 : deload,
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
  //
  // The exercise's NAME is the authoritative signal, not whatever happened
  // to be logged last time — gating on `historicallySided` too used to mean
  // one stray "Add L/R set" tap on an ordinary bilateral exercise (never
  // named "single-arm/leg") would permanently flip every future suggestion
  // for it into an L/R split, and the reverse: an exercise genuinely meant
  // to be tracked two ways (a two-arm session, a one-arm session on another
  // day, same catalog entry) would ping-pong its suggested weight between
  // completely different numbers depending purely on which was logged most
  // recently. If you actually want a movement tracked both ways with its
  // own separate progression per version, give the unilateral version its
  // own catalog entry (e.g. "Single-Arm Dumbbell Row") rather than
  // alternating L/R on the same one.
  const historicallySided = last.sets.some((s) => s.side)
  if (forceUnilateral) {
    if (historicallySided) {
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
    // Newly recognized as unilateral (by name) but history still has it
    // logged bilaterally from before — there's no real per-side data to
    // split, so start both sides from the same bilateral progression as a
    // reasonable first guess and let the actual L/R split take over from here.
    const { targetWeight, targetReps } = target(completed)
    return last.sets.flatMap(() => [
      { reps: targetReps, weight: targetWeight, side: 'left' as const },
      { reps: targetReps, weight: targetWeight, side: 'right' as const },
    ])
  }

  const { targetWeight, targetReps } = target(completed)
  return last.sets.map(() => ({ reps: targetReps, weight: targetWeight }))
}

/**
 * Applies an explicit "sets per exercise" override from the compose-workout
 * picker on top of suggestSets' usual result — trims extra sets, or pads
 * with the last suggested set's numbers (so the added ones aren't blank)
 * when the override asks for more than was suggested. No-op when unset.
 *
 * `count` is a count of sets the way a lifter says it out loud — for a
 * unilateral (L/R-paired) result that means pairs, not raw rows, so
 * trimming or padding always keeps whole left+right pairs intact instead
 * of ever leaving a lone side.
 */
export function applySetsOverride(
  suggested: { reps: number; weight: number; side?: 'left' | 'right' }[],
  count?: number,
): { reps: number; weight: number; side?: 'left' | 'right' }[] {
  if (!count) return suggested
  const isSided = suggested.some((s) => s.side)
  const unit = isSided ? 2 : 1
  const targetLength = count * unit
  if (targetLength === suggested.length) return suggested
  if (targetLength < suggested.length) return suggested.slice(0, targetLength)
  const lastUnit = isSided ? suggested.slice(-2) : [suggested[suggested.length - 1] ?? { reps: 0, weight: 0 }]
  const filler: typeof suggested = []
  while (filler.length < targetLength - suggested.length) filler.push(...lastUnit.map((s) => ({ ...s })))
  return [...suggested, ...filler.slice(0, targetLength - suggested.length)]
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
