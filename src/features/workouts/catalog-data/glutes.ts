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
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Adductors', role: 'secondary', activationScore: 0.45 },
      { muscle: 'Quadriceps', role: 'secondary', activationScore: 0.35 },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Barbell Glute Bridge',
    muscleGroup: 'Glutes',
    equipment: 'Barbell',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.45 },
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
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.65 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Core', role: 'stabilizer', activationScore: 0.4 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Glute Kickback',
    muscleGroup: 'Glutes',
    equipment: 'Cable',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.4 },
    ],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Lateral Walk',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary', activationScore: 1 },
      { muscle: 'Hip Abductors', role: 'secondary', activationScore: 0.65 },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Fire Hydrant (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary', activationScore: 1 },
      { muscle: 'Obliques', role: 'stabilizer', activationScore: 0.35 },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Curtsy Lunge',
    muscleGroup: 'Glutes',
    equipment: 'Dumbbell',
    movementPattern: 'lunge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 0.95 },
      { muscle: 'Gluteus Medius', role: 'primary', activationScore: 0.9 },
      { muscle: 'Quadriceps', role: 'primary', activationScore: 0.85 },
      { muscle: 'Adductors', role: 'secondary', activationScore: 0.6 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Step-Up (Dumbbell)',
    muscleGroup: 'Glutes',
    equipment: 'Dumbbell',
    movementPattern: 'lunge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Quadriceps', role: 'primary', activationScore: 0.9 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.55 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Frog Pump',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.45 },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Reverse Hyperextension',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.75 },
      { muscle: 'Erector Spinae', role: 'secondary', activationScore: 0.6 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Pull-Through',
    muscleGroup: 'Glutes',
    equipment: 'Cable',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'primary', activationScore: 0.8 },
      { muscle: 'Erector Spinae', role: 'secondary', activationScore: 0.5 },
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
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary', activationScore: 1 },
      { muscle: 'Hip Abductors', role: 'secondary', activationScore: 0.6 },
    ],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Clamshell',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Medius', role: 'primary', activationScore: 1 },
      { muscle: 'Gluteus Maximus', role: 'secondary', activationScore: 0.4 },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Donkey Kick (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.45 },
    ],
    repRangeLow: 15,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: '45-Degree Hyperextension (Glute-Focused)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 0.95 },
      { muscle: 'Hamstrings', role: 'primary', activationScore: 0.85 },
      { muscle: 'Erector Spinae', role: 'secondary', activationScore: 0.75 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Kettlebell Swing',
    muscleGroup: 'Glutes',
    equipment: 'Kettlebell',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'primary', activationScore: 0.85 },
      { muscle: 'Erector Spinae', role: 'secondary', activationScore: 0.65 },
      { muscle: 'Core', role: 'secondary', activationScore: 0.6 },
      { muscle: 'Anterior Deltoid', role: 'secondary', activationScore: 0.4 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Single-Leg Hip Thrust (Bodyweight)',
    muscleGroup: 'Glutes',
    equipment: 'Bodyweight',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.7 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Quadriceps', role: 'secondary', activationScore: 0.35 },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'B-Stance Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Barbell',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.5 },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Hip Thrust Machine (Plate-Loaded)',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.5 },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Standing Glute Kickback Machine',
    muscleGroup: 'Glutes',
    equipment: 'Machine',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.4 },
    ],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Banded Hip Thrust',
    muscleGroup: 'Glutes',
    equipment: 'Bands',
    movementPattern: 'hip_hinge',
    targetMuscles: [
      { muscle: 'Gluteus Maximus', role: 'primary', activationScore: 1 },
      { muscle: 'Gluteus Medius', role: 'secondary', activationScore: 0.65 },
      { muscle: 'Hamstrings', role: 'secondary', activationScore: 0.45 },
    ],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
]
