// Shared domain types for the Life app.

export type ID = string

export type TaskTrackingType = 'checkbox' | 'quantity'

export type HealthLinkType = 'workout' | 'exercise' | 'cardio' | 'medicine'

/**
 * Marks a daily task as health-related and, for workout/exercise, ties it to
 * a specific saved template or exercise (denormalized `refName` so the list
 * doesn't need a join to display it).
 */
export interface HealthLink {
  type: HealthLinkType
  refId?: ID
  refName?: string
}

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
  /** Set when this task is a workout, exercise, cardio, or medicine item
   * rather than a plain to-do. */
  healthLink?: HealthLink
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
  /** 0-1 relative activation for this muscle on this specific exercise,
   * finer-grained than `role` — e.g. a flat bench press's sternal chest
   * fibers score ~1.0 while its clavicular fibers, still worked but less
   * so at that angle, score ~0.5. Informed estimates (grip/angle/stability
   * biomechanics, and published EMG comparisons for the handful of lifts
   * that have been studied), not lab measurements for every exercise —
   * unset falls back to a flat per-role default. */
  activationScore?: number
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
  /** Broad biomechanical category, e.g. "horizontal_push", "hip_hinge" —
   * lets future features compare exercises across the catalog (spot an
   * unbalanced workout, flag near-duplicates) without parsing names.
   * Research-backed catalog entries only; not required. */
  movementPattern?: string
  createdAt: number
}

export interface WorkoutSet {
  reps: number
  weight: number
  /** Set when logging a unilateral exercise (single-arm row, split squat,
   * etc.) per side instead of as one bilateral set. Absent = bilateral. */
  side?: 'left' | 'right'
  /** Seconds held/performed — for timed exercises like planks, for cardio (a
   * "cardio set" is just duration ± distance; reps/weight are unused and
   * left at 0), and for a Yoga/Pilates pose hold (reps/weight unused). */
  durationSeconds?: number
  /** Seconds of rest/transition after this set before the next one —
   * Yoga/Pilates only, for "pre-timing" a flow (1 min pose, 15s reset, next
   * pose...). Read by useSequenceTimer when playing a block back
   * automatically; ignored otherwise. */
  restAfterSeconds?: number
  /** Distance covered — cardio only. */
  distanceMiles?: number
  /** Perceived effort — cardio only. Defaults to 'moderate' when unset. */
  intensity?: 'easy' | 'moderate' | 'hard'
  /** Estimated calories burned for this cardio block — cardio only, computed
   * from duration/intensity but editable in case you have a device reading. */
  calories?: number
  /** Average / peak heart rate during this block, bpm — cardio only. Typed
   * in from a machine/watch, or filled in by a Health Connect import. */
  avgHeartRate?: number
  maxHeartRate?: number
  /** Treadmill/incline-walk grade, percent — cardio only. */
  incline?: number
  /** Machine resistance level (bike, elliptical, rower) — cardio only. */
  resistance?: number
  /** Health Connect record id when this block was imported from a watch —
   * how the importer knows not to offer the same workout twice. */
  externalId?: string
  /** App that recorded an imported block, e.g. "com.garmin.android.apps.connectmobile". */
  externalSource?: string
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
  /** Shared id + display name linking entries that came in together as one
   * named composed/saved workout (e.g. "Back Day #2" started from Plan) —
   * lets the Log page collapse them under one header, distinct from cardio
   * or extra exercises added ad hoc into the same day's session. Unset for
   * anything added one-off ("Add another exercise", quick cardio, etc). */
  blockId?: string
  blockTitle?: string
  /** Set alongside blockId when the block came from starting/importing a
   * saved WorkoutTemplate (as opposed to a save-as-you-go composed workout,
   * which has a blockId/blockTitle but no source template to point back
   * at). Lets "switch exercise" offer a *permanent* swap — editing the
   * template itself — in addition to a same-day-only one. */
  templateId?: ID
}

export interface WorkoutSession {
  id: ID
  date: string
  title?: string
  entries: WorkoutExerciseEntry[]
  notes?: string
  /** Set when the workout is marked finished — freezes the duration shown
   * from createdAt. Cleared again if the workout is reopened. */
  endedAt?: number
  /** Set when the user removes the elapsed-time tracker for this workout —
   * hides duration/calories and stops the clock without touching any
   * logged sets. Re-enabling resets `createdAt` so the clock restarts from
   * that moment instead of jumping to a large stale elapsed time. */
  noTimer?: boolean
  /** A hand-entered duration for this workout — corrects a clock that got
   * cleared or was never started, or stands in entirely for someone who
   * doesn't time workouts at all. Always takes priority over the live
   * clock wherever duration is shown or used (calorie estimate included). */
  durationOverrideSeconds?: number
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
    plannedSets: {
      reps: number
      weight: number
      /** Planned hold time — Yoga/Pilates entries only. */
      durationSeconds?: number
      /** Planned rest/transition after this pose — Yoga/Pilates only. */
      restAfterSeconds?: number
    }[]
  }[]
  createdAt: number
  updatedAt: number
}

/** Optional personal stats used only to personalize workout calorie
 * estimates (see workouts/calories.ts) — every field is optional and
 * missing/incomplete data just falls back to a plain weight-based estimate. */
export interface UserProfile {
  ageYears?: number
  heightIn?: number
  sex?: 'male' | 'female'
}

export interface HealthSnapshot {
  date: string
  steps?: number
  weightLbs?: number
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

/**
 * A training program: an ordered rotation of saved workouts (e.g. Push A ->
 * Pull A -> Legs A -> Push B...), deliberately not pinned to weekdays — a
 * missed Tuesday doesn't break anything, the rotation just waits for you.
 * Position in the rotation is derived from what you've actually logged
 * (see programProgress), never stored as a counter that can drift.
 */
export interface Program {
  id: ID
  name: string
  /** Saved workouts in rotation order. The same workout may appear more
   * than once (e.g. A/B/A). `templateName` is denormalized for display
   * in case the template is later deleted. */
  slots: { templateId: ID; templateName: string }[]
  /** Only one program is active at a time. */
  active: boolean
  /** Optional block length, e.g. an 8-week hypertrophy block. */
  lengthWeeks?: number
  /** ISO date the program was last activated — week counting starts here. */
  startDate: string
  /** Rotation position as of `anchorAt` (ms). Reset on activate, skip, or
   * "do this one next"; workouts started after anchorAt advance from it. */
  anchorIndex: number
  anchorAt: number
  createdAt: number
  updatedAt: number
}
