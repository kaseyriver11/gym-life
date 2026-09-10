import { useUserCollection } from '@/lib/use-collection'
import type { LongTermTask } from '@/types'

export function useLongTermTasks() {
  return useUserCollection<Omit<LongTermTask, 'id'>>('longTermTasks')
}

export const CATEGORY_LABELS: Record<LongTermTask['category'], string> = {
  home: 'Home',
  errands: 'Errands',
  projects: 'Projects',
  shopping: 'Shopping',
  other: 'Other',
}

export const PRIORITY_ORDER: Record<LongTermTask['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}
