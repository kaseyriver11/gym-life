import { useUserCollection, where } from '@/lib/use-collection'
import type { DailyTaskDef, DailyTaskLog } from '@/types'
import { weekdayOf } from './weekdays'

export function useTaskDefs() {
  return useUserCollection<Omit<DailyTaskDef, 'id'>>('taskDefs')
}

export function useTaskLogs(date: string) {
  return useUserCollection<Omit<DailyTaskLog, 'id'>>('taskLogs', [
    where('date', '==', date),
  ])
}

/** Which task definitions actually occur on the given date. */
export function occurrencesForDate<T extends Pick<DailyTaskDef, 'isOneTime' | 'date' | 'repeatDays' | 'createdAt'>>(
  defs: T[],
  date: string,
): T[] {
  const weekday = weekdayOf(date)
  const [year, month, day] = date.split('-').map(Number)
  const endOfDay = new Date(year, month - 1, day + 1).getTime()
  return defs.filter((def) => {
    if (def.isOneTime) return def.date === date
    return (def.repeatDays ?? []).includes(weekday) && def.createdAt < endOfDay
  })
}

// Sorting happens client-side rather than via Firestore orderBy, because
// orderBy would silently drop tasks missing the `time` field, and because a
// single `where` filter needs no composite index.
export function sortTaskDefs<T extends { time?: string; createdAt: number }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time)
    if (a.time) return -1
    if (b.time) return 1
    return a.createdAt - b.createdAt
  })
}
