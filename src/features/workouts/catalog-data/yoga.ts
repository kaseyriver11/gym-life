import type { Exercise } from '@/types'

/**
 * Yoga/Pilates poses — logged by hold duration rather than reps/weight (see
 * WorkoutSet.durationSeconds/restAfterSeconds), same as Cardio logs by
 * duration/distance. No targetMuscles/activationScore data, so the muscle
 * map has nothing to show for these groups, same as Cardio.
 */
export const YOGA_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Downward Dog', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: "Child's Pose", muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Mountain Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Warrior I', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Warrior II', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Triangle Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Tree Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Cobra Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Cat-Cow', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Seated Forward Bend', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Bridge Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Pigeon Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Chair Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Plank Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Side Plank', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Corpse Pose (Savasana)', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Camel Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Eagle Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
]

export const PILATES_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'The Hundred', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Roll-Up', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Single-Leg Circle', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Rolling Like a Ball', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Single-Leg Stretch', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Double-Leg Stretch', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Spine Stretch Forward', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Saw', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Swan', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Side Kick Series', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Plank (Pilates)', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
  { name: 'Teaser', muscleGroup: 'Pilates', equipment: 'Bodyweight', createdAt: Date.now() },
]
