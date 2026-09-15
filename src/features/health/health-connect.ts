import { HealthFitness } from '@capacitor/health-fitness'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const LINK_KEY = 'healthConnectLinked'

export function healthConnectAvailable() {
  return Capacitor.isNativePlatform()
}

export async function isHealthConnectLinked(): Promise<boolean> {
  if (!healthConnectAvailable()) return false
  const { value } = await Preferences.get({ key: LINK_KEY })
  return value === 'true'
}

/** Requests read-only access to Health Connect step data — scoped to just
 * STEPS (not the broader variable groups) since that's all this app uses. */
export async function connectHealthConnect(): Promise<void> {
  await HealthFitness.requestHealthPermissions({
    customPermissions: JSON.stringify([{ Variable: 'STEPS', AccessType: 'READ' }]),
    allVariables: JSON.stringify({ IsActive: false, AccessType: 'READ' }),
    fitnessVariables: JSON.stringify({ IsActive: false, AccessType: 'READ' }),
    healthVariables: JSON.stringify({ IsActive: false, AccessType: 'READ' }),
    profileVariables: JSON.stringify({ IsActive: false, AccessType: 'READ' }),
    workoutVariables: '{}',
  })
  // requestHealthPermissions() resolving only means the OS permission sheet
  // ran to completion, not that access was actually granted — there's no
  // way to check grant status directly, so this just remembers "the user
  // went through the connect flow" for UI purposes. A denied permission
  // shows up as fetchTodaySteps() quietly returning 0, not an error.
  await Preferences.set({ key: LINK_KEY, value: 'true' })
}

export async function disconnectHealthConnect(): Promise<void> {
  await HealthFitness.disconnectFromHealthConnect()
  await Preferences.remove({ key: LINK_KEY })
}

function isoAt(d: Date): string {
  return d.toISOString().split('.')[0] + 'Z'
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

/** Sums whatever numeric field each raw record/result block exposes. The
 * plugin's `results` shape isn't documented anywhere — not the README, not
 * the example app, which just logs it — so this checks every plausible
 * field name rather than assuming one. If this comes back 0 with real data
 * behind it, log the raw JSON (see fetchTodaySteps) and adjust the field
 * name here. */
function extractStepsTotal(raw: string | undefined): number {
  if (!raw) return 0
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 0
  }
  const blocks = Array.isArray(parsed) ? parsed : [parsed]
  let total = 0
  for (const block of blocks) {
    if (block && typeof block === 'object') {
      const b = block as Record<string, unknown>
      const candidate = b.value ?? b.total ?? b.sum ?? b.count
      if (typeof candidate === 'number') total += candidate
    }
  }
  return Math.round(total)
}

/** Today's step total from Health Connect (local calendar day). Returns 0
 * on any failure (not connected, permission denied, plugin error) rather
 * than throwing, since a failed background-ish sync shouldn't interrupt
 * the Health page.
 *
 * As of @capacitor/health-fitness 1.0.1, this reliably fails on-device
 * (confirmed via getLastRecord()'s error: "Health Connect isn't installed
 * on the device, or needs to be updated") on Android 17 / Health Connect
 * 17 — almost certainly the plugin's bundled Health Connect client
 * library predating this OS version, not anything fixable from here.
 * getData() itself hangs rather than erroring in the same situation
 * (caught only by the timeout below); parked until the plugin catches up. */
export async function fetchTodaySteps(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  try {
    const { results } = await withTimeout(
      HealthFitness.getData({
        parameters: JSON.stringify({
          Variable: 'STEPS',
          StartDate: isoAt(start),
          EndDate: isoAt(end),
          AdvancedQueryReturnType: 'ALL_DATA',
          AdvancedQueryResultType: 'RAW_DATA',
        }),
      }),
      15000,
      'Health Connect getData()',
    )
    console.log('[HealthConnect] raw steps result:', results)
    return extractStepsTotal(results)
  } catch (err) {
    // A native-side hang (the plugin's promise never resolving or
    // rejecting) is a real observed failure mode here, not hypothetical —
    // the timeout above is what keeps the UI from getting stuck on
    // "Syncing…" forever when it happens.
    console.warn('[HealthConnect] steps sync failed:', err)
    return 0
  }
}
