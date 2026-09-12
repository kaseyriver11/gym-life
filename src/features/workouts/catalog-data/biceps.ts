import type { Exercise } from '@/types'

/**
 * Research-backed biceps exercise catalog. Grounded in EMG literature:
 * neutral/hammer grips shift emphasis to the brachialis and brachioradialis
 * (thickness under the biceps and forearm size) rather than the biceps
 * brachii itself; incline curls stretch the long head for greater long-head
 * emphasis; preacher curls isolate the short head but only over a short arc;
 * pronated reverse curls hit the brachioradialis and forearm extensors.
 */
export const BICEPS_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Barbell Curl (Straight Bar)',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Biceps Brachii', role: 'primary' },
      { muscle: 'Brachialis', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'EZ-Bar Curl',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Biceps Brachii', role: 'primary' },
      { muscle: 'Brachialis', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Dumbbell Curl (Standing, Supinating)',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Biceps Brachii', role: 'primary' }],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Biceps Brachii (Long Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Preacher Curl (Barbell/EZ-Bar)',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    targetMuscles: [{ muscle: 'Biceps Brachii (Short Head)', role: 'primary' }],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Preacher Curl (Dumbbell)',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Biceps Brachii (Short Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Hammer Curl (Dumbbell)',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [
      { muscle: 'Brachialis', role: 'primary' },
      { muscle: 'Brachioradialis', role: 'primary' },
      { muscle: 'Biceps Brachii', role: 'secondary' },
    ],
    repRangeLow: 8,
    repRangeHigh: 12,
    createdAt: Date.now(),
  },
  {
    name: 'Cross-Body Hammer Curl',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [
      { muscle: 'Brachialis', role: 'primary' },
      { muscle: 'Brachioradialis', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Curl (Straight Bar)',
    muscleGroup: 'Biceps',
    equipment: 'Cable',
    targetMuscles: [{ muscle: 'Biceps Brachii', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Cable Curl (Rope, Hammer Grip)',
    muscleGroup: 'Biceps',
    equipment: 'Cable',
    targetMuscles: [
      { muscle: 'Brachialis', role: 'primary' },
      { muscle: 'Brachioradialis', role: 'primary' },
      { muscle: 'Biceps Brachii', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Concentration Curl',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [{ muscle: 'Biceps Brachii', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Reverse Curl (Barbell, Pronated Grip)',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    targetMuscles: [
      { muscle: 'Brachioradialis', role: 'primary' },
      { muscle: 'Brachialis', role: 'secondary' },
      { muscle: 'Forearm Flexors', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Spider Curl',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    targetMuscles: [{ muscle: 'Biceps Brachii (Short Head)', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Zottman Curl',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    targetMuscles: [
      { muscle: 'Biceps Brachii', role: 'primary' },
      { muscle: 'Brachioradialis', role: 'secondary' },
      { muscle: 'Forearm Flexors', role: 'secondary' },
    ],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
  {
    name: 'Machine Bicep Curl',
    muscleGroup: 'Biceps',
    equipment: 'Machine',
    targetMuscles: [{ muscle: 'Biceps Brachii', role: 'primary' }],
    repRangeLow: 10,
    repRangeHigh: 15,
    createdAt: Date.now(),
  },
]
