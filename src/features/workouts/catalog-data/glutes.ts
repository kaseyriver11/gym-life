import type { Exercise } from '@/types'

/**
 * Research-backed glute exercise catalog. Grounded in EMG literature: the
 * barbell glute bridge produces significantly greater upper/lower gluteus
 * maximus and gluteus medius activation than the barbell hip thrust per-rep
 * (the hip thrust's advantage is range of motion and loadability, not raw
 * activation); single-leg/banded variations further raise glute medius
 * involvement.
 *
 * Additions below round out equipment coverage the original 12 lacked:
 * dedicated hip-abduction work (seated machine and standing cable — EMG
 * reviews put the seated abductor machine at or above banded lateral walks
 * for gluteus medius activation) and a glute-biased hyperextension variant,
 * where rounding the upper back and posteriorly tilting the pelvis shifts
 * emphasis from the erectors to the glutes relative to the neutral-spine
 * Reverse Hyperextension already in this file.
 *
 * Second-pass additions cover unilateral-loading and equipment variants
 * that are staples in glute-specialization programs but were absent above:
 * an elevated single-leg hip thrust (distinct from the floor-level
 * Single-Leg Glute Bridge via greater hip ROM), the B-stance and
 * plate-loaded machine hip thrust variants popularized in Contreras-style
 * programming, a selectorized standing kickback machine (isolates the
 * glute with less hamstring carryover than the cable version), and a
 * banded hip thrust for constant-tension, minimal-equipment loading.
 */
export const GLUTES_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Barbell Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Barbell Glute Bridge',
    muscleGroup: 'Glutes',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Gluteus Medius', role: 'secondary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Smith Machine Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Single-Leg Glute Bridge',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Gluteus Medius', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Glute Kickback',
    muscleGroup: 'Glutes',
    equipment: 'Cable',
    targetMuscles: [{ muscle: 'Gluteus Maximus', role: 'primary' }],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Lateral Walk',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    targetMuscles: [{ muscle: 'Gluteus Medius', role: 'primary' }],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Fire Hydrant (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary' },
      { muscle: 'Gluteus Maximus', role: 'secondary' },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Curtsy Lunge',
    muscleGroup: 'Glutes',
    equipment: 'Dumbbell',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary' },
      { muscle: 'Gluteus Maximus', role: 'secondary' },
      { muscle: 'Quadriceps', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Step-Up (Dumbbell)',
    muscleGroup: 'Glutes',
    equipment: 'Dumbbell',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Quadriceps', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Frog Pump',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Gluteus Maximus', role: 'primary' }],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Reverse Hyperextension',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Erector Spinae', role: 'secondary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Pull-Through',
    muscleGroup: 'Glutes',
    equipment: 'Cable',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Seated Hip Abduction Machine',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary' },
      { muscle: 'Hip Abductors', role: 'secondary' },
    ],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Standing Hip Abduction',
    muscleGroup: 'Glutes',
    equipment: 'Cable',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary' },
      { muscle: 'Gluteus Maximus', role: 'stabilizer' },
      { muscle: 'Core', role: 'stabilizer' },
    ],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Clamshell',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary' },
      { muscle: 'Gluteus Maximus', role: 'secondary' },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Donkey Kick (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
      { muscle: 'Core', role: 'stabilizer' },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: '45-Degree Hyperextension (Glute-Focused)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
      { muscle: 'Erector Spinae', role: 'stabilizer' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Kettlebell Swing',
    muscleGroup: 'Glutes',
    equipment: 'Kettlebell',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
      { muscle: 'Core', role: 'stabilizer' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Single-Leg Hip Thrust (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Gluteus Medius', role: 'secondary' },
      { muscle: 'Hamstrings', role: 'secondary' },
      { muscle: 'Core', role: 'stabilizer' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'B-Stance Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Gluteus Medius', role: 'secondary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Hip Thrust Machine (Plate-Loaded)',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Standing Glute Kickback Machine',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    targetMuscles: [{ muscle: 'Gluteus Maximus', role: 'primary' }],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary' },
      { muscle: 'Hamstrings', role: 'secondary' },
    ],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
]
