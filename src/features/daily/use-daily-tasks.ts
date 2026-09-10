import { useUserCollection, where } from '@/lib/use-collection'
import type { DailyTask } from '@/types'

// Sorting happens client-side (see sortDailyTasks) rather than via Firestore
// orderBy, because orderBy would silently drop "anytime" tasks that have no
// `time` field, and because a single `where` filter needs no composite index.
export function useDailyTasks(date: string) {
  return useUserCollection<Omit<DailyTask, 'id'>>('dailyTasks', [
    where('date', '==', date),
  ])
}

export function sortDailyTasks<T extends { time?: string; createdAt: number }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time)
    if (a.time) return -1
    if (b.time) return 1
    return a.createdAt - b.createdAt
  })
}
