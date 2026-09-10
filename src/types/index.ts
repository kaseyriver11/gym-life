// Shared domain types for the Life app.

export type ID = string

export interface DailyTask {
  id: ID
  title: string
  notes?: string
  /** ISO date the task belongs to, e.g. "2026-09-10" */
  date: string
  /** Optional time of day, e.g. "14:30". Absent = "anytime today". */
  time?: string
  completed: boolean
  reminderEnabled: boolean
  createdAt: number
  updatedAt: number
}

export type LongTermCategory =
  | 'home'
  | 'errands'
  | 'projects'
  | 'shopping'
  | 'other'

export type Priority = 'low' | 'medium' | 'high'

export interface LongTermTask {
  id: ID
  title: string
  notes?: string
  category: LongTermCategory
  priority: Priority
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface Exercise {
  id: ID
  name: string
  muscleGroup?: string
  createdAt: number
}

export interface WorkoutSet {
  reps: number
  weight: number
  /** true once the set has actually been performed (vs. planned) */
  completed: boolean
}

export interface WorkoutExerciseEntry {
  exerciseId: ID
  exerciseName: string
  sets: WorkoutSet[]
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

export interface HealthSnapshot {
  date: string
  steps?: number
  weightLbs?: number
  caloriesIn?: number
  caloriesOut?: number
  source: 'manual' | 'health-connect'
}
