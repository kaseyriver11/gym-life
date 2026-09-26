import type { WorkoutSession } from '@/types'
import { isDurationBased, isHoldBased } from './muscle-groups'
import { isSetLogged } from './use-workout-sessions'

const DEFAULT_REP_LOW = 8
const DEFAULT_REP_HIGH = 12

type ExerciseInfo = {
  name?: string
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
  perSide?: boolean
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
  perSide?: boolean,
): (Omit<T, 'side'> & { side?: 'left' | 'right' })[] {
  if ((!isUnilateralByName(exerciseName) && !perSide) || sets.some((s) => s.side)) return sets
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

/** A suggested set: reps/weight for lifts, or a hold time for poses. */
export type SuggestedSet = { reps: number; weight: number; side?: 'left' | 'right'; durationSeconds?: number }

type LoggedSet = WorkoutSession['entries'][number]['sets'][number]

/** One past session of an exercise: its really-logged sets (all entries of
 * that exercise in the session merged — an exercise added twice in one day
 * is still one day's work). */
export interface LoggedSession {
  date: string
  sets: LoggedSet[]
  /** Logged one side at a time (left/right sets). */
  sided: boolean
}

/** Sessions where this exercise was actually logged, newest first. Skipped
 * entries (all greyed-out suggestions) don't count as "last time". */
export function loggedHistory(sessions: WorkoutSession[], exerciseId: string): LoggedSession[] {
  const out: LoggedSession[] = []
  for (const session of sessions) {
    const sets = session.entries
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets.filter(isSetLogged))
    if (sets.length > 0) out.push({ date: session.date, sets, sided: sets.some((s) => s.side) })
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Whether this exercise is done one limb at a time. Your own setting (the
 * "One arm / leg at a time" toggle, stored as a personal perSide override)
 * or the catalog's perSide flag decides; failing that, a "Single-Arm..."
 * style name; failing that, however you logged it last time — so an
 * exercise you split into L/R once comes back split, without you having to
 * find a setting first.
 */
export function isUnilateral(sessions: WorkoutSession[], exerciseId: string, exercise: ExerciseInfo = {}): boolean {
  if (exercise.perSide != null) return exercise.perSide
  if (isUnilateralByName(exercise.name)) return true
  return loggedHistory(sessions, exerciseId)[0]?.sided ?? false
}

/**
 * Suggests this exercise's next sets using double progression (add reps
 * within a target range before adding weight) plus light autoregulation
 * (a very high RPE holds the weight; missing the bottom of the range two
 * sessions running triggers a ~10% deload).
 *
 * Each set progresses from the SAME set last time, so a ramp (45, 55, 65)
 * or pyramid keeps its shape instead of collapsing to the first set's
 * weight. One-arm and two-arm sessions of the same exercise are kept apart:
 * only history logged the same way as today feeds the suggestion (one-arm
 * numbers say little about a two-arm set).
 */
export function suggestSets(
  sessions: WorkoutSession[],
  exerciseId: string,
  exercise: ExerciseInfo = {},
): SuggestedSet[] {
  // Holds (yoga, mobility, pilates) progress by time instead — see below.
  if (isHoldBased(exercise.muscleGroup)) return suggestHolds(sessions, exerciseId, exercise)
  // Cardio is logged by duration/distance, never a rep/weight-style set
  // count — always exactly one activity block, regardless of history.
  if (isDurationBased(exercise.muscleGroup)) return [{ reps: 0, weight: 0 }]

  const sided = isUnilateral(sessions, exerciseId, exercise)
  const all = loggedHistory(sessions, exerciseId)
  const history = all.filter((h) => h.sided === sided)
  const blank = (count: number): SuggestedSet[] =>
    sided
      ? Array.from({ length: count }).flatMap(() => [
          { reps: 0, weight: 0, side: 'left' as const },
          { reps: 0, weight: 0, side: 'right' as const },
        ])
      : Array.from({ length: count }, () => ({ reps: 0, weight: 0 }))

  if (history.length === 0) {
    // Never done this way before. Keep the set count from any history (the
    // other mode) but not its weights — they don't transfer.
    const other = all[0]
    const count = other ? (other.sided ? Math.ceil(other.sets.length / 2) : other.sets.length) : 3
    return blank(count)
  }

  const repLow = exercise.repRangeLow ?? DEFAULT_REP_LOW
  const repHigh = exercise.repRangeHigh ?? DEFAULT_REP_HIGH
  const increment = weightIncrement(exercise.equipment, exercise.muscleGroup)
  const isDumbbellLike = exercise.equipment === 'Dumbbell' || exercise.equipment === 'Kettlebell'

  function progress(set: LoggedSet, prevSet: LoggedSet | undefined): { reps: number; weight: number } {
    if (set.reps < repLow) {
      // Missed the bottom of the range. Twice in a row at this weight =
      // deload ~10%; once = hold the weight and aim for the bottom again.
      const missedTwice = !!prevSet && prevSet.reps < repLow && prevSet.weight <= set.weight && increment > 0
      const deload = missedTwice ? roundToHalf(set.weight * 0.9) : set.weight
      return {
        // Land a dumbbell deload on a weight that exists on the rack —
        // unless the logged weight itself wasn't a multiple of 5 (you have
        // finer-grained plates), in which case keep your precision.
        weight: isDumbbellLike && set.weight % 5 === 0 ? Math.round(deload / 5) * 5 : deload,
        reps: repLow,
      }
    }
    const feltBrutal = set.rpe != null && set.rpe >= 9.5
    if (set.reps >= repHigh && increment === 0) return { weight: set.weight, reps: set.reps + 1 } // bodyweight: reps only
    if (set.reps >= repHigh && !feltBrutal) return { weight: set.weight + increment, reps: repLow }
    return { weight: set.weight, reps: Math.min(repHigh, set.reps + 1) }
  }

  const [last, prev] = history
  if (!sided) {
    return last.sets.map((set, i) => progress(set, prev?.sets[i]))
  }
  // One side at a time: each side progresses off its own sets.
  const bySide = (h: LoggedSession | undefined, side: 'left' | 'right') => h?.sets.filter((s) => s.side === side) ?? []
  const lastL = bySide(last, 'left')
  const lastR = bySide(last, 'right')
  const prevL = bySide(prev, 'left')
  const prevR = bySide(prev, 'right')
  const pairs = Math.max(lastL.length, lastR.length)
  const out: SuggestedSet[] = []
  for (let i = 0; i < pairs; i++) {
    // A side skipped that set borrows the other side's numbers.
    const l = lastL[i] ?? lastR[i]
    const r = lastR[i] ?? lastL[i]
    out.push({ ...progress(l, prevL[i]), side: 'left' }, { ...progress(r, prevR[i]), side: 'right' })
  }
  return out
}

/** Starting hold for a pose/stretch you've never logged. */
const DEFAULT_HOLD_SECONDS = 30
/** Each session nudges the hold a little longer... */
const HOLD_STEP_SECONDS = 5
/** ...up to a point where longer static holds stop adding much. */
const HOLD_CAP_SECONDS = 90

/**
 * Hold-time progression for stretches and poses: repeat last session's
 * holds (same count, same sides) with each one nudged 5s longer, capped at
 * 90s. Pilates moves are timed but not "held" in the same sense, so they
 * just repeat. One-sided holds (perSide) come as left/right pairs, each
 * side progressing off its own last time — a tight left hip shouldn't be
 * dragged along by the right.
 */
function suggestHolds(
  sessions: WorkoutSession[],
  exerciseId: string,
  exercise: ExerciseInfo,
): SuggestedSet[] {
  const perSide = !!exercise.perSide
  const progresses = exercise.muscleGroup !== 'Pilates'
  const logged = (loggedHistory(sessions, exerciseId)[0]?.sets ?? []).filter((s) => (s.durationSeconds ?? 0) > 0)
  const next = (sec: number) => (progresses ? Math.min(HOLD_CAP_SECONDS, Math.max(sec, sec + HOLD_STEP_SECONDS)) : sec)

  if (logged.length === 0) {
    const d = progresses ? DEFAULT_HOLD_SECONDS : 0
    return perSide
      ? [
          { reps: 0, weight: 0, side: 'left', durationSeconds: d || undefined },
          { reps: 0, weight: 0, side: 'right', durationSeconds: d || undefined },
        ]
      : [{ reps: 0, weight: 0, durationSeconds: d || undefined }]
  }
  if (perSide && !logged.some((s) => s.side)) {
    // Logged both-sides-at-once before it was marked one-sided: split it.
    return logged.flatMap((s) => [
      { reps: 0, weight: 0, side: 'left' as const, durationSeconds: next(s.durationSeconds!) },
      { reps: 0, weight: 0, side: 'right' as const, durationSeconds: next(s.durationSeconds!) },
    ])
  }
  return logged.map((s) => ({
    reps: 0,
    weight: 0,
    ...(s.side ? { side: s.side } : {}),
    durationSeconds: next(s.durationSeconds!),
  }))
}

/**
 * The sets a saved workout's exercise should start with. Your own history
 * wins over numbers stored in the workout — otherwise a workout saved with
 * that day's weights suggests those same weights forever and never
 * progresses. The workout's numbers are used only for an exercise you've
 * never logged, and always for holds (a routine's hold/rest timings are
 * its design, not a guess). Either way the workout's set count is kept.
 */
export function setsForTemplateEntry(
  sessions: WorkoutSession[],
  entry: {
    exerciseId: string
    exerciseName: string
    plannedSets: { reps: number; weight: number; durationSeconds?: number; restAfterSeconds?: number }[]
  },
  exercise: ExerciseInfo | undefined,
): (SuggestedSet & { restAfterSeconds?: number })[] {
  const info = { ...exercise, name: entry.exerciseName }
  const hasPlan = entry.plannedSets.some((s) => s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0)
  const neverLogged = loggedHistory(sessions, entry.exerciseId).length === 0
  if (hasPlan && (isHoldBased(exercise?.muscleGroup) || neverLogged)) {
    return applyUnilateralSplit(entry.plannedSets, entry.exerciseName, isUnilateral(sessions, entry.exerciseId, info))
  }
  const suggested = suggestSets(sessions, entry.exerciseId, info)
  return isDurationBased(exercise?.muscleGroup) ? suggested : applySetsOverride(suggested, entry.plannedSets.length || undefined)
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
  suggested: SuggestedSet[],
  count?: number,
): SuggestedSet[] {
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
