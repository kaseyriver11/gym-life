import type { Exercise } from '@/types'

/**
 * Research-backed triceps exercise catalog. Grounded in EMG literature: the
 * long head is stretched (and most activated) with the arm overhead, so
 * overhead extensions produce the highest long-head EMG of any triceps
 * exercise; pushdowns bias the lateral head and are gentlest on the elbows;
 * skull crushers hit all three heads, more so than pushdowns for the long
 * head when lowered behind the head rather than to the forehead.
 */
export const TRICEPS_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Cable Pushdown (Straight Bar)',
    muscleGroup: 'Triceps',
    equipment: 'Cable',
    targetMuscles: [{ muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Pushdown (Rope)',
    muscleGroup: 'Triceps',
    equipment: 'Cable',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Triceps Brachii (Long Head)', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Overhead Cable Triceps Extension',
    muscleGroup: 'Triceps',
    equipment: 'Cable',
    targetMuscles: [{ muscle: 'Triceps Brachii (Long Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Overhead Dumbbell Triceps Extension (Two-Hand)',
    muscleGroup: 'Triceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Triceps Brachii (Long Head)', role: 'primary' }],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Single-Arm Overhead Dumbbell Extension',
    muscleGroup: 'Triceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Triceps Brachii (Long Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Skull Crusher (EZ-Bar, to Forehead)',
    muscleGroup: 'Triceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Triceps Brachii (Long Head)', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Skull Crusher (Incline, Behind Head)',
    muscleGroup: 'Triceps',
    equipment: 'Barbell',
    targetMuscles: [{ muscle: 'Triceps Brachii (Long Head)', role: 'primary' }],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Close-Grip Bench Press',
    muscleGroup: 'Triceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Pec Major (Sternocostal / Mid-Lower Chest)', role: 'secondary' },
      { muscle: 'Anterior Deltoid', role: 'secondary' },
    ],
    repRangeLow: 6,
    repRangeHigh: 10,
    createdAt: Date.now(),
  },
  {
    name: 'Dip (Triceps-Focused, upright torso)',
    muscleGroup: 'Triceps',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Anterior Deltoid', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Triceps Kickback (Dumbbell)',
    muscleGroup: 'Triceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' }],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Triceps Kickback',
    muscleGroup: 'Triceps',
    equipment: 'Cable',
    targetMuscles: [{ muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' }],
    repRangeLow: 12,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'JM Press',
    muscleGroup: 'Triceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Triceps Brachii (Long Head)', role: 'secondary' },
    ],
    repRangeLow: 6,
    repRangeHigh: 10,
    createdAt: Date.now(),
  },
  {
    name: 'Machine Triceps Extension',
    muscleGroup: 'Triceps',
    equipment: 'Machine',
    targetMuscles: [{ muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Bench Dip',
    muscleGroup: 'Triceps',
    equipment: 'Bodyweight',
    targetMuscles: [
      { muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' },
      { muscle: 'Anterior Deltoid', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Tate Press',
    muscleGroup: 'Triceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Triceps Brachii (Lateral Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
]
