import type { Exercise } from '@/types'

/**
 * Research-backed forearms & grip exercise catalog. Wrist curls/extensions
 * isolate the flexor or extensor mass depending on palm orientation; reverse
 * curls and behind-the-back wrist curls bias brachioradialis alongside the
 * extensors since the loaded position keeps the wrist extensors under
 * tension through a longer range. Dead hangs and pinch holds train grip as
 * an isometric hold rather than a curling motion, so they carry over to
 * carries and pulling strength more directly than a wrist-curl machine does.
 */
export const FOREARMS_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Barbell Wrist Curl (Palms Up)',
    muscleGroup: 'Forearms',
    equipment: 'Barbell',
    movementPattern: 'isolation',
    targetMuscles: [{ muscle: 'Forearm Flexors', role: 'primary', activationScore: 1 }],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Barbell Wrist Extension (Palms Down)',
    muscleGroup: 'Forearms',
    equipment: 'Barbell',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Forearm Extensors', role: 'primary', activationScore: 1 },
      { muscle: 'Brachioradialis', role: 'secondary', activationScore: 0.45 },
    ],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Dumbbell Wrist Curl',
    muscleGroup: 'Forearms',
    equipment: 'Dumbbell',
    movementPattern: 'isolation',
    targetMuscles: [{ muscle: 'Forearm Flexors', role: 'primary', activationScore: 1 }],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Dumbbell Wrist Extension',
    muscleGroup: 'Forearms',
    equipment: 'Dumbbell',
    movementPattern: 'isolation',
    targetMuscles: [
      { muscle: 'Forearm Extensors', role: 'primary', activationScore: 1 },
      { muscle: 'Brachioradialis', role: 'secondary', activationScore: 0.4 },
    ],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Dead Hang',
    muscleGroup: 'Forearms',
    equipment: 'Bodyweight',
    movementPattern: 'carry',
    targetMuscles: [
      { muscle: 'Forearm Flexors', role: 'primary', activationScore: 1 },
      { muscle: 'Trapezius (Mid/Lower)', role: 'secondary', activationScore: 0.6 },
      { muscle: 'Latissimus Dorsi', role: 'secondary', activationScore: 0.55 },
      { muscle: 'Rhomboids', role: 'secondary', activationScore: 0.45 },
    ],
    repRangeLow: 20,
    repRangeHigh: 60,
    createdAt: Date.now(),
  },
  {
    name: 'Behind-the-Back Barbell Wrist Curl',
    muscleGroup: 'Forearms',
    equipment: 'Barbell',
    movementPattern: 'isolation',
    targetMuscles: [{ muscle: 'Forearm Flexors', role: 'primary', activationScore: 1 }],
    repRangeLow: 12,
    repRangeHigh: 20,
    createdAt: Date.now(),
  },
  {
    name: 'Plate Pinch Hold',
    muscleGroup: 'Forearms',
    equipment: 'Other',
    movementPattern: 'carry',
    targetMuscles: [
      { muscle: 'Forearm Flexors', role: 'primary', activationScore: 1 },
      { muscle: 'Forearm Extensors', role: 'secondary', activationScore: 0.5 },
    ],
    repRangeLow: 20,
    repRangeHigh: 45,
    createdAt: Date.now(),
  },
]
