import type { Exercise } from '@/types'

/**
 * Yoga/Pilates poses — logged by hold duration rather than reps/weight (see
 * WorkoutSet.durationSeconds/restAfterSeconds), same as Cardio logs by
 * duration/distance. Yoga poses carry the areas they stretch/load as
 * targetMuscles (for the muscle map) and one-sided poses are `perSide`.
 */
export const YOGA_EXERCISES: Omit<Exercise, 'id'>[] = [
  {
    name: 'Downward Dog',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hamstrings', role: 'primary' }, { muscle: 'Gastrocnemius', role: 'primary' }, { muscle: 'Latissimus Dorsi', role: 'secondary' }, { muscle: 'Anterior Deltoid', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: "Child's Pose",
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Erector Spinae', role: 'primary' }, { muscle: 'Latissimus Dorsi', role: 'primary' }, { muscle: 'Gluteus Maximus', role: 'secondary' }],
    createdAt: Date.now(),
  },
  { name: 'Mountain Pose', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  {
    name: 'Warrior I',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hip Flexors', role: 'primary' }, { muscle: 'Quadriceps', role: 'primary' }, { muscle: 'Gluteus Maximus', role: 'secondary' }],
    perSide: true,
    createdAt: Date.now(),
  },
  {
    name: 'Warrior II',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Quadriceps', role: 'primary' }, { muscle: 'Adductors', role: 'primary' }, { muscle: 'Lateral Deltoid', role: 'secondary' }],
    perSide: true,
    createdAt: Date.now(),
  },
  {
    name: 'Triangle Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hamstrings', role: 'primary' }, { muscle: 'Obliques', role: 'primary' }, { muscle: 'Adductors', role: 'secondary' }],
    perSide: true,
    createdAt: Date.now(),
  },
  {
    name: 'Tree Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Gluteus Medius', role: 'primary' }, { muscle: 'Adductors', role: 'secondary' }, { muscle: 'Soleus', role: 'secondary' }],
    perSide: true,
    createdAt: Date.now(),
  },
  {
    name: 'Cobra Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Rectus Abdominis (Upper)', role: 'primary' }, { muscle: 'Hip Flexors', role: 'primary' }, { muscle: 'Erector Spinae', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Cat-Cow',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Erector Spinae', role: 'primary' }, { muscle: 'Rectus Abdominis (Upper)', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Seated Forward Bend',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hamstrings', role: 'primary' }, { muscle: 'Erector Spinae', role: 'primary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Bridge Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hip Flexors', role: 'primary' }, { muscle: 'Quadriceps', role: 'primary' }, { muscle: 'Gluteus Maximus', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Pigeon Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Gluteus Maximus', role: 'primary' }, { muscle: 'Hip Flexors', role: 'primary' }],
    perSide: true,
    createdAt: Date.now(),
  },
  {
    name: 'Chair Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Quadriceps', role: 'primary' }, { muscle: 'Gluteus Maximus', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Plank Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Rectus Abdominis (Upper)', role: 'primary' }, { muscle: 'Rectus Abdominis (Lower)', role: 'primary' }, { muscle: 'Anterior Deltoid', role: 'secondary' }],
    createdAt: Date.now(),
  },
  // Side Plank lives in core.ts (same catalog id) — see there.
  { name: 'Corpse Pose (Savasana)', muscleGroup: 'Yoga', equipment: 'Bodyweight', createdAt: Date.now() },
  {
    name: 'Camel Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Hip Flexors', role: 'primary' }, { muscle: 'Rectus Abdominis (Upper)', role: 'primary' }, { muscle: 'Quadriceps', role: 'secondary' }],
    createdAt: Date.now(),
  },
  {
    name: 'Eagle Pose',
    muscleGroup: 'Yoga',
    equipment: 'Bodyweight',
    targetMuscles: [{ muscle: 'Posterior Deltoid', role: 'primary' }, { muscle: 'Rhomboids', role: 'primary' }, { muscle: 'Gluteus Medius', role: 'secondary' }],
    perSide: true,
    createdAt: Date.now(),
  },
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
