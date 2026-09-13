import type { Exercise } from '@/types'

/**
 * Maps our own detailed muscle-target strings (from catalog-data/*.ts) down
 * to the `body-muscles` library's region ids. Unlike the old body diagram
 * (one blob per broad group), this one splits most regions by actual
 * anatomical head/portion AND left/right side — e.g. chest genuinely has
 * separate upper (clavicular) and lower (sternocostal) shapes, matching what
 * the catalog data already tracks. A bilateral exercise lights up both
 * sides; `null` = a muscle this library has no visual representation for
 * (mostly deep/small stabilizers with no distinct surface shape).
 */
const MUSCLE_NAME_TO_IDS: Record<string, string[] | null> = {
  'Pec Major (Clavicular / Upper Chest)': ['chest-upper-left', 'chest-upper-right'],
  'Pec Major (Sternocostal / Mid-Lower Chest)': ['chest-lower-left', 'chest-lower-right'],
  'Triceps Brachii': [
    'triceps-long-left',
    'triceps-long-right',
    'triceps-lateral-left',
    'triceps-lateral-right',
  ],
  'Triceps Brachii (long head)': ['triceps-long-left', 'triceps-long-right'],
  'Triceps Brachii (Long Head)': ['triceps-long-left', 'triceps-long-right'],
  'Triceps Brachii (Lateral Head)': ['triceps-lateral-left', 'triceps-lateral-right'],
  'Anterior Deltoid': ['shoulder-front-left', 'shoulder-front-right'],
  'Lateral Deltoid': ['shoulder-side-left', 'shoulder-side-right'],
  'Posterior Deltoid': ['deltoid-rear-left', 'deltoid-rear-right'],
  'Latissimus Dorsi': [
    'lats-upper-left',
    'lats-upper-right',
    'lats-mid-left',
    'lats-mid-right',
    'lats-lower-left',
    'lats-lower-right',
  ],
  'Trapezius (Upper)': ['traps-upper-left', 'traps-upper-right'],
  'Trapezius (Mid/Lower)': ['traps-mid-left', 'traps-mid-right', 'traps-lower-left', 'traps-lower-right'],
  // No dedicated rhomboid shape — anatomically they sit directly under mid
  // traps, the closest visible stand-in.
  Rhomboids: ['traps-mid-left', 'traps-mid-right'],
  // No dedicated teres major shape — it sits at the upper-lat/armpit border.
  'Teres Major': ['lats-upper-left', 'lats-upper-right'],
  'Erector Spinae': ['lower-back-erectors-left', 'lower-back-erectors-right'],
  'Biceps Brachii': ['biceps-left', 'biceps-right'],
  'Biceps Brachii (Long Head)': ['biceps-left', 'biceps-right'],
  'Biceps Brachii (Short Head)': ['biceps-left', 'biceps-right'],
  // No dedicated brachialis shape — it sits directly under the biceps.
  Brachialis: ['biceps-left', 'biceps-right'],
  Brachioradialis: ['forearm-left', 'forearm-right'],
  'Forearm Flexors': ['forearm-flexors-left', 'forearm-flexors-right'],
  Quadriceps: ['quads-left', 'quads-right'],
  Hamstrings: [
    'hamstrings-medial-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-left',
    'hamstrings-lateral-right',
  ],
  'Gluteus Maximus': ['gluteus-maximus-left', 'gluteus-maximus-right'],
  'Gluteus Medius': ['gluteus-medius-left', 'gluteus-medius-right'],
  Adductors: ['adductors-left', 'adductors-right'],
  // No dedicated abductor shape — gluteus medius is the primary hip abductor.
  'Hip Abductors': ['gluteus-medius-left', 'gluteus-medius-right'],
  Gastrocnemius: [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
  ],
  Soleus: ['calves-soleus-left', 'calves-soleus-right'],
  'Rectus Abdominis (Upper)': ['abs-upper-left', 'abs-upper-right'],
  'Rectus Abdominis (Lower)': ['abs-lower-left', 'abs-lower-right'],
  Obliques: ['obliques-left', 'obliques-right'],
  // Deep core, no surface shape of its own — shown across the whole ab wall.
  'Transverse Abdominis': ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  Core: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  'Core (anti-rotation)': [
    'abs-upper-left',
    'abs-upper-right',
    'abs-lower-left',
    'abs-lower-right',
    'obliques-left',
    'obliques-right',
  ],
  'Hip Flexors': ['hip-flexor-left', 'hip-flexor-right'],
  // Deep, small stabilizers with no distinct surface shape in this model.
  'Rotator Cuff': null,
  Coracobrachialis: null,
  'Serratus Anterior': ['serratus-anterior-left', 'serratus-anterior-right'],
  // Convenience entries for the manual muscle picker (not used by catalog
  // data, which is always specific about gastroc vs. soleus / delt head).
  Calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
    'calves-soleus-left',
    'calves-soleus-right',
  ],
  Neck: ['neck-left', 'neck-right'],
}

/** Backward compat for any custom exercise or personal note already saved
 * with a raw slug from the old body-diagram library (e.g. a user's own
 * exercise created before this swap). Maps each old slug to the closest new
 * region(s) so existing picks keep working without a data migration. */
const LEGACY_SLUG_TO_IDS: Record<string, string[]> = {
  chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  triceps: ['triceps-long-left', 'triceps-long-right', 'triceps-lateral-left', 'triceps-lateral-right'],
  biceps: ['biceps-left', 'biceps-right'],
  'front-deltoids': ['shoulder-front-left', 'shoulder-front-right'],
  'back-deltoids': ['deltoid-rear-left', 'deltoid-rear-right'],
  trapezius: [
    'traps-upper-left',
    'traps-upper-right',
    'traps-mid-left',
    'traps-mid-right',
    'traps-lower-left',
    'traps-lower-right',
  ],
  'upper-back': [
    'lats-upper-left',
    'lats-upper-right',
    'lats-mid-left',
    'lats-mid-right',
    'lats-lower-left',
    'lats-lower-right',
  ],
  'lower-back': ['lower-back-erectors-left', 'lower-back-erectors-right'],
  abs: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  obliques: ['obliques-left', 'obliques-right'],
  quadriceps: ['quads-left', 'quads-right'],
  hamstring: [
    'hamstrings-medial-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-left',
    'hamstrings-lateral-right',
  ],
  adductor: ['adductors-left', 'adductors-right'],
  abductors: ['gluteus-medius-left', 'gluteus-medius-right'],
  calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
    'calves-soleus-left',
    'calves-soleus-right',
  ],
  gluteal: ['gluteus-maximus-left', 'gluteus-maximus-right'],
  forearm: ['forearm-left', 'forearm-right'],
  head: ['head'],
  neck: ['neck-left', 'neck-right'],
  knees: ['knee-left', 'knee-right'],
  'left-soleus': ['calves-soleus-left'],
  'right-soleus': ['calves-soleus-right'],
}

/** Every id this library's front+back models can render — used to validate
 * a directly user-picked or legacy-stored value. */
const ALL_MUSCLE_IDS = new Set<string>([
  'head',
  'face',
  'neck-left',
  'neck-right',
  'shoulder-front-left',
  'shoulder-front-right',
  'shoulder-side-left',
  'shoulder-side-right',
  'biceps-left',
  'biceps-right',
  'forearm-left',
  'forearm-right',
  'chest-upper-left',
  'chest-upper-right',
  'chest-lower-left',
  'chest-lower-right',
  'abs-upper-left',
  'abs-upper-right',
  'abs-lower-left',
  'abs-lower-right',
  'obliques-left',
  'obliques-right',
  'adductors-left',
  'adductors-right',
  'quads-left',
  'quads-right',
  'serratus-anterior-left',
  'serratus-anterior-right',
  'hip-flexor-left',
  'hip-flexor-right',
  'knee-left',
  'knee-right',
  'tibialis-anterior-left',
  'tibialis-anterior-right',
  'elbow-left',
  'elbow-right',
  'hand-left',
  'hand-right',
  'foot-left',
  'foot-right',
  'head-back',
  'nape',
  'spine',
  'traps-upper-left',
  'traps-upper-right',
  'traps-mid-left',
  'traps-mid-right',
  'traps-lower-left',
  'traps-lower-right',
  'deltoid-rear-left',
  'deltoid-rear-right',
  'lats-upper-left',
  'lats-upper-right',
  'lats-mid-left',
  'lats-mid-right',
  'lats-lower-left',
  'lats-lower-right',
  'lower-back-erectors-left',
  'lower-back-erectors-right',
  'lower-back-ql-left',
  'lower-back-ql-right',
  'triceps-long-left',
  'triceps-long-right',
  'triceps-lateral-left',
  'triceps-lateral-right',
  'forearm-flexors-left',
  'forearm-flexors-right',
  'forearm-extensors-left',
  'forearm-extensors-right',
  'gluteus-maximus-left',
  'gluteus-maximus-right',
  'gluteus-medius-left',
  'gluteus-medius-right',
  'hamstrings-medial-left',
  'hamstrings-medial-right',
  'hamstrings-lateral-left',
  'hamstrings-lateral-right',
  'calves-gastroc-medial-left',
  'calves-gastroc-medial-right',
  'calves-gastroc-lateral-left',
  'calves-gastroc-lateral-right',
  'calves-soleus-left',
  'calves-soleus-right',
  'hand-back-left',
  'hand-back-right',
  'knee-back-left',
  'knee-back-right',
  'foot-back-left',
  'foot-back-right',
])

/** Friendly coarse label per region id — used for the tap-to-inspect detail
 * and the "X-dominant" summary line. Chest and traps keep their upper/mid/
 * lower distinction since that's genuinely meaningful; a few groups (lats,
 * hamstrings, calves) collapse the medial/lateral or upper/mid/lower split
 * back to one label since gym-goers don't usually think of those as
 * separately-trained regions. */
const ID_LABELS: Record<string, string> = {}
function label(ids: string[], text: string) {
  for (const id of ids) ID_LABELS[id] = text
}
label(['head', 'head-back', 'face'], 'Head')
label(['neck-left', 'neck-right', 'nape'], 'Neck')
label(['shoulder-front-left', 'shoulder-front-right'], 'Front Delts')
label(['shoulder-side-left', 'shoulder-side-right'], 'Side Delts')
label(['deltoid-rear-left', 'deltoid-rear-right'], 'Rear Delts')
label(['biceps-left', 'biceps-right'], 'Biceps')
label(['triceps-long-left', 'triceps-long-right', 'triceps-lateral-left', 'triceps-lateral-right'], 'Triceps')
label(
  ['forearm-left', 'forearm-right', 'forearm-flexors-left', 'forearm-flexors-right', 'forearm-extensors-left', 'forearm-extensors-right'],
  'Forearms',
)
label(['chest-upper-left', 'chest-upper-right'], 'Upper Chest')
label(['chest-lower-left', 'chest-lower-right'], 'Lower Chest')
label(['abs-upper-left', 'abs-upper-right'], 'Upper Abs')
label(['abs-lower-left', 'abs-lower-right'], 'Lower Abs')
label(['obliques-left', 'obliques-right'], 'Obliques')
label(['adductors-left', 'adductors-right'], 'Adductors')
label(['quads-left', 'quads-right'], 'Quads')
label(['serratus-anterior-left', 'serratus-anterior-right'], 'Serratus Anterior')
label(['hip-flexor-left', 'hip-flexor-right'], 'Hip Flexors')
label(['knee-left', 'knee-right', 'knee-back-left', 'knee-back-right'], 'Knees')
label(['tibialis-anterior-left', 'tibialis-anterior-right'], 'Shins')
label(['elbow-left', 'elbow-right'], 'Elbows')
label(['hand-left', 'hand-right', 'hand-back-left', 'hand-back-right'], 'Hands')
label(['foot-left', 'foot-right', 'foot-back-left', 'foot-back-right'], 'Feet')
label(['spine'], 'Spine')
label(['traps-upper-left', 'traps-upper-right', 'traps-mid-left', 'traps-mid-right', 'traps-lower-left', 'traps-lower-right'], 'Traps')
label(['lats-upper-left', 'lats-upper-right', 'lats-mid-left', 'lats-mid-right', 'lats-lower-left', 'lats-lower-right'], 'Lats')
label(['lower-back-erectors-left', 'lower-back-erectors-right', 'lower-back-ql-left', 'lower-back-ql-right'], 'Lower Back')
label(['gluteus-maximus-left', 'gluteus-maximus-right', 'gluteus-medius-left', 'gluteus-medius-right'], 'Glutes')
label(
  ['hamstrings-medial-left', 'hamstrings-medial-right', 'hamstrings-lateral-left', 'hamstrings-lateral-right'],
  'Hamstrings',
)
label(
  [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
    'calves-soleus-left',
    'calves-soleus-right',
  ],
  'Calves',
)

export { ID_LABELS }

/** Curated set offered in the "which muscles does this work" picker when a
 * user adds their own exercise or personalizes one — stores our own
 * detailed-name vocabulary (the same strings the research catalog uses),
 * not raw library ids, so a user's pick and a catalog entry are always
 * described the same way. */
export const MUSCLE_PICKER_OPTIONS: { value: string; label: string }[] = [
  { value: 'Pec Major (Clavicular / Upper Chest)', label: 'Upper Chest' },
  { value: 'Pec Major (Sternocostal / Mid-Lower Chest)', label: 'Lower Chest' },
  { value: 'Latissimus Dorsi', label: 'Lats' },
  { value: 'Trapezius (Upper)', label: 'Traps (Upper)' },
  { value: 'Trapezius (Mid/Lower)', label: 'Traps (Mid/Lower)' },
  { value: 'Erector Spinae', label: 'Lower Back' },
  { value: 'Anterior Deltoid', label: 'Front Delts' },
  { value: 'Lateral Deltoid', label: 'Side Delts' },
  { value: 'Posterior Deltoid', label: 'Rear Delts' },
  { value: 'Biceps Brachii', label: 'Biceps' },
  { value: 'Triceps Brachii', label: 'Triceps' },
  { value: 'Forearm Flexors', label: 'Forearms' },
  { value: 'Rectus Abdominis (Upper)', label: 'Upper Abs' },
  { value: 'Rectus Abdominis (Lower)', label: 'Lower Abs' },
  { value: 'Obliques', label: 'Obliques' },
  { value: 'Quadriceps', label: 'Quads' },
  { value: 'Hamstrings', label: 'Hamstrings' },
  { value: 'Adductors', label: 'Adductors' },
  { value: 'Hip Abductors', label: 'Abductors' },
  { value: 'Calves', label: 'Calves' },
  { value: 'Gluteus Maximus', label: 'Glutes' },
  { value: 'Hip Flexors', label: 'Hip Flexors' },
  { value: 'Neck', label: 'Neck' },
]

/** Which of MUSCLE_SUBGROUPS' "specific area" values a given primary-muscle
 * pick implies — e.g. picking "Upper Chest" as the primary muscle already
 * says everything a separate "specific area" dropdown would, so the
 * custom-exercise form derives it instead of asking twice. Muscles with no
 * meaningful subgroup (biceps, triceps, glutes, adductors, ...) return
 * undefined, matching "no specific area" today. */
const PRIMARY_TO_SUBGROUP: Record<string, string> = {
  'Pec Major (Clavicular / Upper Chest)': 'Upper Chest',
  'Pec Major (Sternocostal / Mid-Lower Chest)': 'Lower Chest',
  'Latissimus Dorsi': 'Lats',
  'Trapezius (Upper)': 'Traps',
  'Trapezius (Mid/Lower)': 'Traps',
  'Erector Spinae': 'Lower Back',
  'Anterior Deltoid': 'Front Delts',
  'Lateral Deltoid': 'Side Delts',
  'Posterior Deltoid': 'Rear Delts',
  'Rectus Abdominis (Upper)': 'Upper Abs',
  'Rectus Abdominis (Lower)': 'Lower Abs',
  Obliques: 'Obliques',
  Quadriceps: 'Quads',
  Hamstrings: 'Hamstrings',
  Calves: 'Calves',
}

export function subgroupForMuscle(muscle: string | undefined): string | undefined {
  return muscle ? PRIMARY_TO_SUBGROUP[muscle] : undefined
}

function resolveIds(name: string): string[] {
  if (name in MUSCLE_NAME_TO_IDS) return MUSCLE_NAME_TO_IDS[name] ?? []
  if (name in LEGACY_SLUG_TO_IDS) return LEGACY_SLUG_TO_IDS[name]
  return ALL_MUSCLE_IDS.has(name) ? [name] : []
}

/** Fallback for exercises with no targetMuscles data (custom, user-typed). */
const GROUP_FALLBACK_IDS: Partial<Record<string, string[]>> = {
  Chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  Back: ['lats-upper-left', 'lats-upper-right', 'lats-mid-left', 'lats-mid-right', 'lats-lower-left', 'lats-lower-right'],
  Shoulders: ['shoulder-front-left', 'shoulder-front-right'],
  Biceps: ['biceps-left', 'biceps-right'],
  Triceps: ['triceps-long-left', 'triceps-long-right', 'triceps-lateral-left', 'triceps-lateral-right'],
  Legs: [
    'quads-left',
    'quads-right',
    'hamstrings-medial-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-left',
    'hamstrings-lateral-right',
  ],
  Glutes: ['gluteus-maximus-left', 'gluteus-maximus-right'],
  Core: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  Cardio: [],
  'Full Body': [
    'chest-upper-left',
    'chest-upper-right',
    'lats-upper-left',
    'lats-upper-right',
    'quads-left',
    'quads-right',
    'abs-upper-left',
    'abs-upper-right',
  ],
}

const SUBGROUP_FALLBACK_IDS: Partial<Record<string, string[]>> = {
  'Upper Chest': ['chest-upper-left', 'chest-upper-right'],
  'Lower Chest': ['chest-lower-left', 'chest-lower-right'],
  Lats: ['lats-upper-left', 'lats-upper-right', 'lats-mid-left', 'lats-mid-right', 'lats-lower-left', 'lats-lower-right'],
  Traps: ['traps-upper-left', 'traps-upper-right', 'traps-mid-left', 'traps-mid-right', 'traps-lower-left', 'traps-lower-right'],
  Rhomboids: ['traps-mid-left', 'traps-mid-right'],
  'Lower Back': ['lower-back-erectors-left', 'lower-back-erectors-right'],
  'Front Delts': ['shoulder-front-left', 'shoulder-front-right'],
  'Side Delts': ['shoulder-side-left', 'shoulder-side-right'],
  'Rear Delts': ['deltoid-rear-left', 'deltoid-rear-right'],
  Quads: ['quads-left', 'quads-right'],
  Hamstrings: [
    'hamstrings-medial-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-left',
    'hamstrings-lateral-right',
  ],
  Calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
    'calves-soleus-left',
    'calves-soleus-right',
  ],
  'Upper Abs': ['abs-upper-left', 'abs-upper-right'],
  'Lower Abs': ['abs-lower-left', 'abs-lower-right'],
  Obliques: ['obliques-left', 'obliques-right'],
}

export interface MuscleIdRoles {
  primary: string[]
  secondary: string[]
}

export type ExerciseLike = Pick<Exercise, 'targetMuscles' | 'muscleGroup' | 'muscleSubgroup'>

export function slugsForExercise(ex: ExerciseLike): MuscleIdRoles {
  if (ex.targetMuscles && ex.targetMuscles.length > 0) {
    const primary = new Set<string>()
    const secondary = new Set<string>()
    for (const target of ex.targetMuscles) {
      const bucket = target.role === 'primary' ? primary : secondary
      for (const id of resolveIds(target.muscle)) bucket.add(id)
    }
    return { primary: [...primary], secondary: [...secondary] }
  }

  const subgroupIds = ex.muscleSubgroup ? SUBGROUP_FALLBACK_IDS[ex.muscleSubgroup] : undefined
  const groupIds = ex.muscleGroup ? GROUP_FALLBACK_IDS[ex.muscleGroup] : undefined
  return { primary: subgroupIds ?? groupIds ?? [], secondary: [] }
}
