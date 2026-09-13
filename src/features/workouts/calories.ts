import type { WorkoutExerciseEntry } from '@/types'

/**
 * MET (metabolic equivalent) values from the Compendium of Physical
 * Activities — standard reference intensities, not measured for this
 * specific user. Good enough for a rough "how much did that burn" estimate,
 * not a precise figure.
 */
const CARDIO_MET: Record<string, number> = {
  'Running (Outdoor)': 9.8,
  'Running (Treadmill)': 9.8,
  Walking: 3.5,
  'Incline Walking (Treadmill)': 6.0,
  'Cycling (Outdoor)': 7.5,
  'Stationary Bike': 7.0,
  Elliptical: 5.0,
  'Rowing Machine': 7.0,
  StairMaster: 9.0,
  'Jump Rope': 11.0,
  Swimming: 7.0,
  'Stair Climbing (Stairs)': 8.0,
}
const DEFAULT_CARDIO_MET = 7.0
/** Resistance training, vigorous effort (Compendium code 02054). */
const STRENGTH_MET = 6.0

const LBS_TO_KG = 0.453592

/**
 * Estimates calories burned for a whole session: each cardio set uses its
 * own tracked duration at that activity's MET; the remaining session time
 * (total elapsed minus time already attributed to cardio) is charged at a
 * flat strength-training MET, since individual strength sets aren't timed.
 */
export function estimateSessionCalories(
  session: { entries: WorkoutExerciseEntry[]; createdAt: number; endedAt?: number },
  exercisesById: Map<string, { muscleGroup?: string; name: string }>,
  weightLbs: number,
  now: number,
): number {
  const weightKg = weightLbs * LBS_TO_KG
  let cardioCalories = 0
  let cardioSeconds = 0

  for (const entry of session.entries) {
    const info = exercisesById.get(entry.exerciseId)
    if (info?.muscleGroup !== 'Cardio') continue
    const met = CARDIO_MET[info.name] ?? DEFAULT_CARDIO_MET
    const seconds = entry.sets.reduce((n, s) => n + (s.durationSeconds ?? 0), 0)
    cardioSeconds += seconds
    cardioCalories += met * weightKg * (seconds / 3600)
  }

  const sessionSeconds = Math.max(0, Math.floor(((session.endedAt ?? now) - session.createdAt) / 1000))
  const strengthSeconds = Math.max(0, sessionSeconds - cardioSeconds)
  const strengthCalories = STRENGTH_MET * weightKg * (strengthSeconds / 3600)

  return Math.round(cardioCalories + strengthCalories)
}
