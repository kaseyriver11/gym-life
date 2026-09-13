export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Legs',
  'Glutes',
  'Core',
  'Cardio',
  'Full Body',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

/** Optional finer-grained area within a broad muscle group. */
export const MUSCLE_SUBGROUPS: Partial<Record<MuscleGroup, string[]>> = {
  Chest: ['Upper Chest', 'Lower Chest'],
  Back: ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
  Shoulders: ['Front Delts', 'Side Delts', 'Rear Delts'],
  Legs: ['Quads', 'Hamstrings', 'Calves'],
  Core: ['Upper Abs', 'Lower Abs', 'Obliques'],
}

interface MuscleGroupStyle {
  /** Left border accent on a card */
  border: string
  /** Numbered badge / dot background+text */
  badge: string
  /** Small text-only accent, e.g. section headers */
  text: string
  /** Plain dot, e.g. legend/list markers */
  dot: string
}

const MUSCLE_GROUP_STYLES: Record<MuscleGroup, MuscleGroupStyle> = {
  Chest: {
    border: 'border-l-rose-500',
    badge: 'bg-rose-500/20 text-rose-300',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  Back: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/20 text-blue-300',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  Shoulders: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/20 text-amber-300',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  Biceps: {
    border: 'border-l-violet-500',
    badge: 'bg-violet-500/20 text-violet-300',
    text: 'text-violet-400',
    dot: 'bg-violet-500',
  },
  Triceps: {
    border: 'border-l-fuchsia-500',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300',
    text: 'text-fuchsia-400',
    dot: 'bg-fuchsia-500',
  },
  Forearms: {
    border: 'border-l-lime-500',
    badge: 'bg-lime-500/20 text-lime-300',
    text: 'text-lime-400',
    dot: 'bg-lime-500',
  },
  Legs: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  Glutes: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/20 text-orange-300',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
  },
  Core: {
    border: 'border-l-cyan-500',
    badge: 'bg-cyan-500/20 text-cyan-300',
    text: 'text-cyan-400',
    dot: 'bg-cyan-500',
  },
  Cardio: {
    border: 'border-l-red-500',
    badge: 'bg-red-500/20 text-red-300',
    text: 'text-red-400',
    dot: 'bg-red-500',
  },
  'Full Body': {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-500/20 text-indigo-300',
    text: 'text-indigo-400',
    dot: 'bg-indigo-500',
  },
}

const FALLBACK_STYLE: MuscleGroupStyle = {
  border: 'border-l-neutral-600',
  badge: 'bg-neutral-700 text-neutral-300',
  text: 'text-neutral-400',
  dot: 'bg-neutral-500',
}

export function muscleGroupStyle(group?: string): MuscleGroupStyle {
  if (group && group in MUSCLE_GROUP_STYLES) {
    return MUSCLE_GROUP_STYLES[group as MuscleGroup]
  }
  return FALLBACK_STYLE
}
