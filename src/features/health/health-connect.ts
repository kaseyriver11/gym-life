import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { Health, type HealthPermission, type Workout } from 'capacitor-health'

const LINK_KEY = 'healthConnectLinked'

/** Everything this app reads — steps for the Health tab, and workouts (with
 * the distance/calories/heart rate recorded during them) for importing
 * cardio logged on a watch. Read-only; nothing is ever written back. */
const PERMISSIONS: HealthPermission[] = [
  'READ_STEPS',
  'READ_WORKOUTS',
  'READ_DISTANCE',
  'READ_ACTIVE_CALORIES',
  'READ_TOTAL_CALORIES',
  'READ_HEART_RATE',
]

export function healthConnectAvailable() {
  return Capacitor.isNativePlatform()
}

export async function isHealthConnectLinked(): Promise<boolean> {
  if (!healthConnectAvailable()) return false
  const { value } = await Preferences.get({ key: LINK_KEY })
  return value === 'true'
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ])
}

/** Asks for read access. Throws with a readable message if Health Connect
 * itself is missing/outdated or nothing was granted. Android only lets an
 * app show the permission sheet a couple of times — after that the user has
 * to grant access inside the Health Connect app (openHealthConnectSettings). */
export async function connectHealthConnect(): Promise<void> {
  const { available } = await Health.isHealthAvailable()
  if (!available) {
    throw new Error('Health Connect isn\'t installed or needs an update — check the Play Store.')
  }
  const { permissions } = await Health.requestHealthPermissions({ permissions: PERMISSIONS })
  const granted = Object.assign({}, ...permissions) as Record<string, boolean>
  if (!granted.READ_STEPS && !granted.READ_WORKOUTS) {
    throw new Error('No access was granted. You can allow it in the Health Connect app → App permissions → Gym-Life.')
  }
  await Preferences.set({ key: LINK_KEY, value: 'true' })
}

/** Health Connect has no "revoke" API for apps — this just stops syncing
 * here; permissions themselves are managed in the Health Connect app. */
export async function disconnectHealthConnect(): Promise<void> {
  await Preferences.remove({ key: LINK_KEY })
}

export function openHealthConnectSettings() {
  return Health.openHealthConnectSettings()
}

/** Today's step total (local calendar day). Throws on failure so the Health
 * tab can show why, rather than silently writing 0 over a real count. */
export async function fetchTodaySteps(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const { aggregatedData } = await withTimeout(
    Health.queryAggregated({
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      dataType: 'steps',
      bucket: 'day',
    }),
    15000,
    'Steps sync',
  )
  return Math.round(aggregatedData.reduce((sum, d) => sum + d.value, 0))
}

export type HealthWorkout = Workout & { title?: string }

/** Workouts (exercise sessions) recorded in the last `days` days, with
 * per-workout heart-rate samples when that permission was granted. */
export async function fetchRecentWorkouts(days = 14): Promise<HealthWorkout[]> {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 3600 * 1000)
  const { workouts } = await withTimeout(
    Health.queryWorkouts({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      includeHeartRate: true,
      includeRoute: false,
      includeSteps: false,
    }),
    30000,
    'Workout import',
  )
  return workouts as HealthWorkout[]
}
