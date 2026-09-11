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
