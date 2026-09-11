import { useUserCollection } from '@/lib/use-collection'
import type { GoalDef } from '@/types'

export function useGoals() {
  return useUserCollection<Omit<GoalDef, 'id'>>('goals')
}

export function goalProgress(goal: Pick<GoalDef, 'startValue' | 'targetValue' | 'currentValue' | 'direction'>) {
  const span = goal.targetValue - goal.startValue
  if (span === 0) return goal.currentValue >= goal.targetValue ? 100 : 0
  const pct = ((goal.currentValue - goal.startValue) / span) * 100
  return Math.max(0, Math.min(100, pct))
}
