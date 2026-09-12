import type { Exercise } from '@/types'

/**
 * Research-backed glute exercise catalog. Grounded in EMG literature: the
 * barbell glute bridge produces significantly greater upper/lower gluteus
 * maximus and gluteus medius activation than the barbell hip thrust per-rep
 * (the hip thrust's advantage is range of motion and loadability, not raw
 * activation); single-leg/banded variations further raise glute medius
 * involvement.
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
]
