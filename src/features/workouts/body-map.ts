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
  'Triceps Brachii (Long Head)': 'triceps',
  'Triceps Brachii (Lateral Head)': 'triceps',
  'Anterior Deltoid': 'front-deltoids',
  'Lateral Deltoid': 'front-deltoids',
  'Posterior Deltoid': 'back-deltoids',
  'Latissimus Dorsi': 'upper-back',
  'Trapezius (Upper)': 'trapezius',
  'Trapezius (Mid/Lower)': 'trapezius',
  Rhomboids: 'upper-back',
  'Teres Major': 'upper-back',
  'Erector Spinae': 'lower-back',
  'Biceps Brachii': 'biceps',
  'Biceps Brachii (Long Head)': 'biceps',
  'Biceps Brachii (Short Head)': 'biceps',
  Brachialis: 'biceps',
  Brachioradialis: 'forearm',
  'Forearm Flexors': 'forearm',
  Quadriceps: 'quadriceps',
  Hamstrings: 'hamstring',
  'Gluteus Maximus': 'gluteal',
  'Gluteus Medius': 'abductors',
  Adductors: 'adductor',
  'Hip Abductors': 'abductors',
  Gastrocnemius: 'calves',
  Soleus: 'calves',
  'Rectus Abdominis (Upper)': 'abs',
  'Rectus Abdominis (Lower)': 'abs',
  Obliques: 'obliques',
  'Transverse Abdominis': 'abs',
  Core: 'abs',
  'Core (anti-rotation)': 'abs',
  'Hip Flexors': null,
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

/** Every slug the body model can render — used to validate a directly
 * user-picked muscle (as opposed to one of our own freeform research
 * strings above). */
const ALL_MUSCLE_SLUGS = new Set<string>([
  'chest',
  'triceps',
  'biceps',
  'front-deltoids',
  'back-deltoids',
  'trapezius',
  'upper-back',
  'lower-back',
  'abs',
  'obliques',
  'quadriceps',
  'hamstring',
  'adductor',
  'abductors',
  'calves',
  'gluteal',
  'forearm',
  'head',
  'neck',
  'knees',
  'left-soleus',
  'right-soleus',
])

/** Curated subset offered in the "which muscles does this work" picker when
 * a user adds their own exercise — leaves out overly fringe/duplicate slugs
 * (head, knees, left/right-soleus) that aren't useful to pick manually. */
export const MUSCLE_PICKER_OPTIONS: Muscle[] = [
  'chest',
  'upper-back',
  'lower-back',
  'trapezius',
  'front-deltoids',
  'back-deltoids',
  'biceps',
  'triceps',
  'forearm',
  'abs',
  'obliques',
  'quadriceps',
  'hamstring',
  'adductor',
  'abductors',
  'calves',
  'gluteal',
  'neck',
]

function resolveSlug(name: string): Muscle | null {
  if (name in MUSCLE_NAME_TO_SLUG) return MUSCLE_NAME_TO_SLUG[name]
  return ALL_MUSCLE_SLUGS.has(name) ? (name as Muscle) : null
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
      const slug = resolveSlug(target.muscle)
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
