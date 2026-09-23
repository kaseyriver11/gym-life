import { format } from 'date-fns'
import type { WorkoutTemplate } from '@/types'
import { applyUnilateralSplit, suggestSets } from './progression'
import { useAllExercises } from './use-all-exercises'
import { useWorkoutSessions } from './use-workout-sessions'

/**
 * Starts a saved workout into today's session — shared by the Plan tab's
 * play buttons and the program "Next up" cards (Plan and Home). Planned
 * numbers from the template win; otherwise each exercise gets progression
 * suggestions from history. All as greyed-out estimates until confirmed.
 */
export function useStartTemplate() {
  const { items: exercises } = useAllExercises()
  const { items: sessions, add: addSession, update: updateSession } = useWorkoutSessions()

  return function startTemplate(template: WorkoutTemplate) {
    const now = Date.now()
    const today = format(new Date(), 'yyyy-MM-dd')
    // blockId doubles as the start timestamp — programProgress relies on it
    // to replay a program's rotation in order.
    const blockId = String(now)
    const newEntries = template.entries.map((entry) => {
      const hasRealPlan = entry.plannedSets.some(
        (s) => s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
      )
      const exerciseInfo = exercises.find((ex) => ex.id === entry.exerciseId)
      const sets = applyUnilateralSplit(
        hasRealPlan ? entry.plannedSets : suggestSets(sessions, entry.exerciseId, exerciseInfo),
        entry.exerciseName,
        exerciseInfo?.perSide,
      )
      return {
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        sets: sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          ...('side' in s ? { side: s.side } : {}),
          ...('durationSeconds' in s ? { durationSeconds: s.durationSeconds } : {}),
          ...('restAfterSeconds' in s ? { restAfterSeconds: s.restAfterSeconds } : {}),
          completed: false,
          isEstimate: s.reps > 0 || s.weight > 0 || (('durationSeconds' in s ? s.durationSeconds : 0) ?? 0) > 0,
        })),
        blockId,
        blockTitle: template.name,
        templateId: template.id,
      }
    })
    // Today may already have a session going (e.g. lifting logged from the
    // Log tab) — starting a template must land in that same session rather
    // than forking a second, same-day session doc that the Log tab's
    // single-session-per-day view can never show alongside the first.
    const existing = sessions.find((s) => s.date === today)
    if (existing) {
      return updateSession(existing.id, { entries: [...existing.entries, ...newEntries], updatedAt: now })
    }
    return addSession({ date: today, entries: newEntries, createdAt: now, updatedAt: now })
  }
}
