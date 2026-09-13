import type { Exercise } from '@/types'

/**
 * Cardio activities — logged as duration/distance rather than reps/weight
 * (see WorkoutSet.durationSeconds/distanceMiles), so unlike the strength
 * catalog these carry no targetMuscles/activationScore data; the muscle map
 * simply has nothing to show for the "Cardio" group, same as it already
 * does for any exercise with no muscle data at all.
 */
export const CARDIO_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Running (Outdoor)', muscleGroup: 'Cardio', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Running (Treadmill)', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'Walking', muscleGroup: 'Cardio', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Incline Walking (Treadmill)', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'Cycling (Outdoor)', muscleGroup: 'Cardio', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Stationary Bike', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'Elliptical', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'Rowing Machine', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'StairMaster', muscleGroup: 'Cardio', equipment: 'Machine', createdAt: Date.now() },
  { name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Other', createdAt: Date.now() },
  { name: 'Swimming', muscleGroup: 'Cardio', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Stair Climbing (Stairs)', muscleGroup: 'Cardio', equipment: 'Bodyweight', createdAt: Date.now() },
]
