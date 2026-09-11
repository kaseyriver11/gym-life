import { useUserCollection } from '@/lib/use-collection'
import type { LongTermTask, TaskListDef } from '@/types'

export function useLongTermTasks() {
  return useUserCollection<Omit<LongTermTask, 'id'>>('longTermTasks')
}

export function useTaskLists() {
  return useUserCollection<Omit<TaskListDef, 'id'>>('taskLists')
}

export const PRIORITY_ORDER: Record<LongTermTask['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}
