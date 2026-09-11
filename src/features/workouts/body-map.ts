import type { Muscle } from 'react-body-highlighter'
import type { Exercise } from '@/types'

/**
 * Maps our own detailed muscle-target strings (from catalog-data/*.ts) down
 * to the fixed slug set react-body-highlighter's body model understands.
 * `null` = a muscle this library has no visual representation for.
 * Extend this as more muscle-group catalogs are added.
 */
const MUSCLE_NAME_TO_SLUG: Record<string, Muscle | null> = {
  'Pec Major (Clavicular / Upper Chest)': 'chest',
  'Pec Major (Sternocostal / Mid-Lower Chest)': 'chest',
  'Triceps Brachii': 'triceps',
  'Triceps Brachii (long head)': 'triceps',
  'Anterior Deltoid': 'front-deltoids',
  'Latissimus Dorsi': 'upper-back',
  Core: 'abs',
  'Core (anti-rotation)': 'abs',
  'Rotator Cuff': null,
  Coracobrachialis: null,
  'Serratus Anterior': null,
}

/** Fallback for exercises with no targetMuscles data (custom, user-typed). */
const GROUP_FALLBACK_SLUGS: Partial<Record<string, Muscle[]>> = {
  Chest: ['chest'],
  Back: ['upper-back'],
  Shoulders: ['front-deltoids'],
  Biceps: ['biceps'],
  Triceps: ['triceps'],
  Legs: ['quadriceps', 'hamstring'],
  Glutes: ['gluteal'],
  Core: ['abs'],
  Cardio: [],
  'Full Body': ['chest', 'upper-back', 'quadriceps', 'abs'],
}

const SUBGROUP_FALLBACK_SLUGS: Partial<Record<string, Muscle[]>> = {
  'Upper Chest': ['chest'],
  'Lower Chest': ['chest'],
  Lats: ['upper-back'],
  Traps: ['trapezius'],
  Rhomboids: ['upper-back'],
  'Lower Back': ['lower-back'],
  'Front Delts': ['front-deltoids'],
  'Side Delts': ['front-deltoids'],
  'Rear Delts': ['back-deltoids'],
  Quads: ['quadriceps'],
  Hamstrings: ['hamstring'],
  Calves: ['calves'],
  'Upper Abs': ['abs'],
  'Lower Abs': ['abs'],
  Obliques: ['obliques'],
}

export interface MuscleSlugRoles {
  primary: Muscle[]
  secondary: Muscle[]
}

export type ExerciseLike = Pick<Exercise, 'targetMuscles' | 'muscleGroup' | 'muscleSubgroup'>

export function slugsForExercise(ex: ExerciseLike): MuscleSlugRoles {
  if (ex.targetMuscles && ex.targetMuscles.length > 0) {
    const primary = new Set<Muscle>()
    const secondary = new Set<Muscle>()
    for (const target of ex.targetMuscles) {
      const slug = MUSCLE_NAME_TO_SLUG[target.muscle]
      if (!slug) continue
      if (target.role === 'primary') primary.add(slug)
      else secondary.add(slug)
    }
    return { primary: [...primary], secondary: [...secondary] }
  }

  const subgroupSlugs = ex.muscleSubgroup ? SUBGROUP_FALLBACK_SLUGS[ex.muscleSubgroup] : undefined
  const groupSlugs = ex.muscleGroup ? GROUP_FALLBACK_SLUGS[ex.muscleGroup] : undefined
  return { primary: subgroupSlugs ?? groupSlugs ?? [], secondary: [] }
}
