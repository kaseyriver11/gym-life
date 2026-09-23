import { Preferences } from '@capacitor/preferences'
import { format } from 'date-fns'
import type { WorkoutSession, WorkoutSet } from '@/types'
import type { HealthWorkout } from './health-connect'

/** Health Connect exercise type -> this app's cardio catalog entry. Anything
 * unmapped becomes "Other Cardio" (changeable before importing). */
const TYPE_TO_ACTIVITY: Record<string, string> = {
  RUNNING: 'Running (Outdoor)',
  RUNNING_TREADMILL: 'Running (Treadmill)',
  WALKING: 'Walking',
  HIKING: 'Hiking',
  BIKING: 'Cycling (Outdoor)',
  BIKING_STATIONARY: 'Stationary Bike',
  ELLIPTICAL: 'Elliptical',
  ROWING_MACHINE: 'Rowing Machine',
  ROWING: 'Rowing (On the Water)',
  PADDLING: 'Kayaking / Paddling',
  STAIR_CLIMBING_MACHINE: 'StairMaster',
  STAIR_CLIMBING: 'Stair Climbing (Stairs)',
  SWIMMING_POOL: 'Swimming',
  SWIMMING_OPEN_WATER: 'Swimming',
  HIGH_INTENSITY_INTERVAL_TRAINING: 'HIIT',
  BOOT_CAMP: 'HIIT',
  BOXING: 'Boxing / Kickboxing',
  MARTIAL_ARTS: 'Boxing / Kickboxing',
  DANCING: 'Dance',
  SKIING: 'Skiing (Downhill)',
  TENNIS: 'Tennis',
  BASKETBALL: 'Basketball',
  SOCCER: 'Soccer',
  GOLF: 'Golf (Walking)',
}

/** Session types this app logs itself, set by set — importing a watch's
 * "Strength training, 55 min" on top would just duplicate that. */
const LOGGED_IN_APP = new Set([
  'STRENGTH_TRAINING',
  'WEIGHTLIFTING',
  'CALISTHENICS',
  'YOGA',
  'PILATES',
  'STRETCHING',
  'GUIDED_BREATHING',
])

export function isImportable(w: HealthWorkout) {
  return !LOGGED_IN_APP.has(w.workoutType)
}

export function defaultActivity(w: HealthWorkout): string {
  return TYPE_TO_ACTIVITY[w.workoutType] ?? 'Other Cardio'
}

/** "BIKING_STATIONARY" -> "Biking stationary", for showing what the watch called it. */
export function prettyType(type: string) {
  const s = type.toLowerCase().replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Stable key per Health Connect record — its id, or start time + type as a
 * fallback if a source didn't provide one. */
export function workoutKey(w: HealthWorkout) {
  return w.id || `${w.startDate}|${w.workoutType}`
}

/** Every externalId already logged, so the importer never offers a workout twice. */
export function importedKeys(sessions: WorkoutSession[]): Set<string> {
  const keys = new Set<string>()
  for (const s of sessions) {
    for (const e of s.entries) {
      for (const set of e.sets) if (set.externalId) keys.add(set.externalId)
    }
  }
  return keys
}

export function heartRateStats(w: HealthWorkout): { avg?: number; max?: number } {
  const bpm = (w.heartRate ?? []).map((h) => h.bpm).filter((b) => b > 0)
  if (bpm.length === 0) return {}
  return {
    avg: Math.round(bpm.reduce((a, b) => a + b, 0) / bpm.length),
    max: Math.max(...bpm),
  }
}

const METERS_PER_MILE = 1609.344

/** The logged cardio block for one imported workout — marked done, since it
 * already happened, and tagged with its source so it's never re-offered. */
export function workoutToSet(w: HealthWorkout): WorkoutSet {
  const { avg, max } = heartRateStats(w)
  const miles = w.distance ? Math.round((w.distance / METERS_PER_MILE) * 100) / 100 : undefined
  return {
    reps: 0,
    weight: 0,
    durationSeconds: Math.round(w.duration),
    distanceMiles: miles || undefined,
    calories: w.calories > 0 ? Math.round(w.calories) : undefined,
    avgHeartRate: avg,
    maxHeartRate: max,
    completed: true,
    externalId: workoutKey(w),
    externalSource: w.sourceBundleId || undefined,
  }
}

export function workoutLocalDate(w: HealthWorkout) {
  return format(new Date(w.startDate), 'yyyy-MM-dd')
}

// Workouts the user chose not to import — remembered on this device only.
const DISMISSED_KEY = 'hcDismissedWorkouts'

export async function loadDismissed(): Promise<Set<string>> {
  const { value } = await Preferences.get({ key: DISMISSED_KEY })
  try {
    return new Set(value ? (JSON.parse(value) as string[]) : [])
  } catch {
    return new Set()
  }
}

export async function dismissWorkouts(keys: string[]) {
  const current = await loadDismissed()
  for (const k of keys) current.add(k)
  // Keep the list from growing forever — only recent ones can resurface anyway.
  const trimmed = [...current].slice(-300)
  await Preferences.set({ key: DISMISSED_KEY, value: JSON.stringify(trimmed) })
}
