// Shared domain types for the Life app.

export type ID = string

export type TaskTrackingType = 'checkbox' | 'quantity'

/**
 * A task's definition/schedule. One-off tasks pin a single `date`; recurring
 * tasks instead set `repeatDays` (0=Sun..6=Sat) and show up on every matching
 * weekday from `createdAt` onward. Per-day progress lives separately in
 * DailyTaskLog, so a recurring task's definition is written once.
 */
export interface DailyTaskDef {
  id: ID
  title: string
  notes?: string
  /** Optional time of day, e.g. "14:30". Absent = "anytime". */
  time?: string
  trackingType: TaskTrackingType
  /** Unit label for quantity tasks, e.g. "glasses", "pages". */
  unit?: string
  /** Target amount for quantity tasks, e.g. 8. */
  targetValue?: number
  reminderEnabled: boolean
  isOneTime: boolean
  /** ISO date, e.g. "2026-09-10". Set when isOneTime is true. */
  date?: string
  /** Weekdays this recurs on, 0=Sun..6=Sat. Set when isOneTime is false. */
  repeatDays?: number[]
  createdAt: number
  updatedAt: number
}

/**
 * One day's progress against a DailyTaskDef. For checkbox tasks, value is
 * 0 or 1. For quantity tasks, value is the amount logged that day.
 */
export interface DailyTaskLog {
  id: ID
  taskId: ID
  date: string
  value: number
  updatedAt: number
}

export type Priority = 'low' | 'medium' | 'high'

export type ListType = 'todo' | 'shopping'

/** A user-created list, e.g. "Honey-Do", "Garage Project", "Groceries". */
export interface TaskListDef {
  id: ID
  name: string
  type: ListType
  createdAt: number
}

export interface LongTermTask {
  id: ID
  title: string
  notes?: string
  listId: ID
  priority: Priority
  /** Free-text amount, e.g. "2 gal" — only meaningful on shopping lists. */
  quantity?: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface MuscleTarget {
  muscle: string
  role: 'primary' | 'secondary' | 'stabilizer'
}

export interface Exercise {
  id: ID
  name: string
  muscleGroup?: string
  /** Finer-grained area within muscleGroup, e.g. "Quads" within "Legs". */
  muscleSubgroup?: string
  equipment?: string
  /** Target rep range for progression decisions, e.g. 8-12. Defaults applied
   * in code (progression.ts) when unset, so this is never required input. */
  repRangeLow?: number
  repRangeHigh?: number
  /** Detailed muscle breakdown (research-backed catalog entries only) —
   * more precise than muscleGroup/muscleSubgroup, e.g. distinguishing the
   * clavicular vs sternocostal pec head rather than just "Chest". */
  targetMuscles?: MuscleTarget[]
  createdAt: number
}

export interface WorkoutSet {
  reps: number
  weight: number
  /** Seconds held/performed — for timed exercises like planks. */
  durationSeconds?: number
  /** true once the set has actually been performed (vs. planned) */
  completed: boolean
  /** true while reps/weight are still an unconfirmed suggestion (from a
   * template or your last session) rather than something you've actually
   * entered or done — rendered as a greyed-out placeholder. */
  isEstimate?: boolean
  /** Rate of perceived exertion, 1-10 (half-steps allowed). Optional — a
   * suggested default is prefilled on completion but never forced. */
  rpe?: number
}

export interface WorkoutExerciseEntry {
  exerciseId: ID
  exerciseName: string
  sets: WorkoutSet[]
  /** Shared id linking this entry to others logged back-to-back as a
   * superset — rest only auto-starts after the last linked exercise. */
  supersetGroup?: number
}

export interface WorkoutSession {
  id: ID
  date: string
  title?: string
  entries: WorkoutExerciseEntry[]
  notes?: string
  createdAt: number
  updatedAt: number
}

/**
 * A saved, reusable workout — e.g. "Push Day A" — not tied to any particular
 * day. Pick it whenever you're ready to do it. Each exercise carries its own
 * planned sets (target reps/weight); starting the template copies those in
 * as greyed-out placeholders (WorkoutSet.isEstimate) ready to confirm.
 */
export interface WorkoutTemplate {
  id: ID
  name: string
  entries: {
    exerciseId: ID
    exerciseName: string
    plannedSets: { reps: number; weight: number }[]
  }[]
  createdAt: number
  updatedAt: number
}

export interface HealthSnapshot {
  date: string
  steps?: number
  weightLbs?: number
  caloriesIn?: number
  caloriesOut?: number
  waterOz?: number
  source: 'manual' | 'health-connect'
}

export type GoalDirection = 'increase' | 'decrease'

/** A long-term trajectory goal, e.g. weight 200 -> 180, push-ups 10 -> 25. */
export interface GoalDef {
  id: ID
  title: string
  unit?: string
  startValue: number
  targetValue: number
  direction: GoalDirection
  /** Most recently logged value; kept denormalized for quick widget reads. */
  currentValue: number
  createdAt: number
  updatedAt: number
}
