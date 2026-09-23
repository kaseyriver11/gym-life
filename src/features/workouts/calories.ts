import type { UserProfile, WorkoutExerciseEntry } from '@/types'
import { isHoldBased } from './muscle-groups'
import { isSetLogged } from './use-workout-sessions'

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
  Hiking: 6.0,
  Rucking: 6.5,
  'Spin Class': 8.5,
  'Air Bike': 8.0,
  SkiErg: 7.5,
  HIIT: 8.0,
  'Boxing / Kickboxing': 7.0,
  Dance: 6.0,
  'Rowing (On the Water)': 6.0,
  'Kayaking / Paddling': 5.0,
  'Skiing (Cross-Country)': 9.0,
  'Skiing (Downhill)': 5.3,
  Pickleball: 5.0,
  Tennis: 7.3,
  Basketball: 6.5,
  Soccer: 7.0,
  'Golf (Walking)': 4.8,
  'Other Cardio': 6.0,
}
const DEFAULT_CARDIO_MET = 7.0
/** Resistance training, vigorous effort (Compendium code 02054). */
const STRENGTH_MET = 6.0
/** Hatha yoga (Compendium code 02150) / Pilates, general (02160) — held
 * poses, not per-pose-calibrated like CARDIO_MET since intensity barely
 * varies pose to pose the way it does across cardio machines. */
const HOLD_MET: Record<'Yoga' | 'Pilates', number> = { Yoga: 2.5, Pilates: 3.0 }

/** Typical time a straight set takes including its rest, for sessions with
 * no reliable elapsed time to work from at all (timer removed and nothing
 * entered by hand) — a rough stand-in, not a substitute for really timing
 * it, but better than assuming zero. */
const AVG_SECONDS_PER_SET = 150

const LBS_TO_KG = 0.453592

/** Perceived-effort multiplier on top of an activity's baseline MET — a hard
 * spin class burns more than an easy recovery ride at the same duration. */
const INTENSITY_MULTIPLIER: Record<'easy' | 'moderate' | 'hard', number> = {
  easy: 0.8,
  moderate: 1,
  hard: 1.25,
}

/**
 * How this person's real metabolism (age/height/sex) compares to a generic
 * same-weight adult — the reference every plain weight-based MET estimate
 * implicitly assumes. Missing/incomplete profile data is a neutral 1×, so
 * this only ever refines the estimate, never breaks it. Clamped to a modest
 * band since this is a rough personalization, not a lab measurement.
 */
function metMultiplier(profile: UserProfile | undefined, weightLbs: number): number {
  if (!profile?.ageYears || !profile.heightIn || !profile.sex) return 1
  const weightKg = weightLbs * LBS_TO_KG
  const heightCm = profile.heightIn * 2.54
  // Mifflin-St Jeor BMR, compared against the same formula for a
  // "reference" average-build adult (5'7", 35) at the same bodyweight.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * profile.ageYears
  const bmr = profile.sex === 'male' ? base + 5 : base - 161
  const referenceBmr = 10 * weightKg + 6.25 * 170 - 5 * 35 - 78
  return Math.min(1.25, Math.max(0.8, bmr / referenceBmr))
}

/** Estimated calories for one cardio block — reused for both the live
 * readout while logging and the whole-session total below. */
export function estimateCardioCalories(
  exerciseName: string,
  durationSeconds: number,
  intensity: 'easy' | 'moderate' | 'hard' | undefined,
  weightLbs: number,
  profile?: UserProfile,
): number {
  const met =
    (CARDIO_MET[exerciseName] ?? DEFAULT_CARDIO_MET) *
    INTENSITY_MULTIPLIER[intensity ?? 'moderate'] *
    metMultiplier(profile, weightLbs)
  return Math.round(met * weightLbs * LBS_TO_KG * (durationSeconds / 3600))
}

/** Estimated calories for one held pose — same duration-driven math as
 * cardio, just off a flat per-modality MET instead of a per-exercise-name
 * table (a plank and a forward fold burn about the same). */
export function estimateHoldCalories(
  muscleGroup: 'Yoga' | 'Pilates',
  durationSeconds: number,
  weightLbs: number,
  profile?: UserProfile,
): number {
  const met = HOLD_MET[muscleGroup] * metMultiplier(profile, weightLbs)
  return Math.round(met * weightLbs * LBS_TO_KG * (durationSeconds / 3600))
}

/**
 * Estimates calories burned for a whole session. Each cardio block uses its
 * own hand-tracked duration at that activity's MET — that's a reliable,
 * directly-entered number. The strength portion deliberately does NOT scale
 * off the session's overall elapsed clock: forgetting to hit "Finish
 * workout" (leaving the timer running for hours) used to inflate the
 * estimate right along with it. Instead it's driven by how many sets were
 * actually performed, at a flat per-set duration, personalized by
 * age/height/sex/weight where that's available.
 */
export function estimateSessionCalories(
  session: { entries: WorkoutExerciseEntry[] },
  exercisesById: Map<string, { muscleGroup?: string; name: string }>,
  weightLbs: number,
  profile?: UserProfile,
): number {
  const weightKg = weightLbs * LBS_TO_KG
  const multiplier = metMultiplier(profile, weightLbs)
  let cardioCalories = 0
  let completedStrengthSets = 0

  for (const entry of session.entries) {
    const info = exercisesById.get(entry.exerciseId)
    if (info?.muscleGroup === 'Cardio') {
      for (const s of entry.sets.filter(isSetLogged)) {
        cardioCalories += s.calories ?? estimateCardioCalories(info.name, s.durationSeconds ?? 0, s.intensity, weightLbs, profile)
      }
    } else if (isHoldBased(info?.muscleGroup)) {
      for (const s of entry.sets.filter(isSetLogged)) {
        cardioCalories += s.calories ?? estimateHoldCalories(info!.muscleGroup as 'Yoga' | 'Pilates', s.durationSeconds ?? 0, weightLbs, profile)
      }
    } else {
      // Counted by really-logged sets (isSetLogged), not the completed
      // toggle — plenty of real logging (numbers typed in, checkbox never
      // tapped) would otherwise vanish from this estimate entirely, while
      // an untouched suggestion for a skipped exercise shouldn't count.
      completedStrengthSets += entry.sets.filter((s) => isSetLogged(s) && s.reps > 0).length
    }
  }

  const strengthCalories =
    STRENGTH_MET * multiplier * weightKg * ((completedStrengthSets * AVG_SECONDS_PER_SET) / 3600)

  return Math.round(cardioCalories + strengthCalories)
}
