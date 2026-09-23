import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * Deterministic 31-bit int id from a string, so the same task always maps
 * to the same local notification id (lets us cancel/reschedule by task id).
 */
function idFromString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 2147483647
}

export async function requestNotificationPermission() {
  const result = await LocalNotifications.requestPermissions()
  return result.display === 'granted'
}

export async function scheduleTaskReminder(params: {
  taskId: string
  title: string
  body?: string
  /** ISO date "YYYY-MM-DD" */
  date: string
  /** "HH:mm" */
  time: string
}) {
  const { taskId, title, body, date, time } = params
  const [hours, minutes] = time.split(':').map(Number)
  const [year, month, day] = date.split('-').map(Number)
  const at = new Date(year, month - 1, day, hours, minutes)
  if (at.getTime() <= Date.now()) return

  await LocalNotifications.schedule({
    notifications: [
      {
        id: idFromString(taskId),
        title,
        body: body ?? 'Due now',
        schedule: { at },
      },
    ],
  })
}

export async function cancelTaskReminder(taskId: string) {
  await LocalNotifications.cancel({ notifications: [{ id: idFromString(taskId) }] })
}

/** Capacitor weekday: 1=Sun..7=Sat. Our weekday: 0=Sun..6=Sat. */
function toCapacitorWeekday(weekday: number) {
  return weekday + 1
}

function recurringId(taskId: string, weekday: number) {
  // Offset so a task's 7 possible weekday notifications never collide with
  // each other or with its one-time-task id.
  return (idFromString(taskId) % 2000000000) * 10 + weekday
}

export async function scheduleRecurringReminder(params: {
  taskId: string
  title: string
  body?: string
  repeatDays: number[]
  /** "HH:mm" */
  time: string
}) {
  const { taskId, title, body, repeatDays, time } = params
  const [hours, minutes] = time.split(':').map(Number)

  await LocalNotifications.schedule({
    notifications: repeatDays.map((weekday) => ({
      id: recurringId(taskId, weekday),
      title,
      body: body ?? 'Due today',
      schedule: {
        on: { weekday: toCapacitorWeekday(weekday), hour: hours, minute: minutes },
        allowWhileIdle: true,
      },
    })),
  })
}

export async function cancelRecurringReminder(taskId: string) {
  await LocalNotifications.cancel({
    notifications: Array.from({ length: 7 }, (_, weekday) => ({
      id: recurringId(taskId, weekday),
    })),
  })
}

/** Fixed id for the one rest-timer alert that can ever be pending — a new
 * rest period simply replaces the previous one. Chosen well outside the
 * range idFromString/recurringId can land on for task reminders. */
const REST_TIMER_NOTIFICATION_ID = 2147480001
const REST_TIMER_CHANNEL_ID = 'rest-timer'

let restChannelReady: Promise<boolean> | null = null

/** Rest alerts need their own high-importance channel — Capacitor's default
 * channel is importance 3, which plays no heads-up banner and is easy to
 * miss with the phone in a pocket. Also asks for notification permission
 * the first time a rest timer runs, rather than up front on app launch. */
function ensureRestChannel(): Promise<boolean> {
  restChannelReady ??= (async () => {
    const { display } = await LocalNotifications.requestPermissions()
    if (display !== 'granted') return false
    await LocalNotifications.createChannel({
      id: REST_TIMER_CHANNEL_ID,
      name: 'Rest timer',
      description: 'Alerts when a rest period between sets is over',
      importance: 5,
      vibration: true,
      visibility: 1,
    })
    return true
  })().catch(() => {
    restChannelReady = null
    return false
  })
  return restChannelReady
}

/**
 * Schedules the system alert for when a rest countdown ends, so it still
 * fires with the screen locked or the app backgrounded — Android suspends
 * the WebView's JS timers then, which is exactly when you're resting.
 * Resolves true only when the alert is actually scheduled, so callers can
 * fall back to an in-app beep otherwise (web, or permission denied).
 */
export async function scheduleRestTimerAlert(endsAt: number, body?: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  if (!(await ensureRestChannel())) return false
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_TIMER_NOTIFICATION_ID,
          title: 'Rest over',
          body: body ?? 'Time for your next set',
          channelId: REST_TIMER_CHANNEL_ID,
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
          autoCancel: true,
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

export async function cancelRestTimerAlert() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_TIMER_NOTIFICATION_ID }] })
    // Also clear it if it already fired and is still sitting in the shade.
    await LocalNotifications.removeDeliveredNotificationsById({ ids: [REST_TIMER_NOTIFICATION_ID] })
  } catch {
    // Nothing pending/delivered — fine.
  }
}
