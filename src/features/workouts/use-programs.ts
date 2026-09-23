import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useUserCollection } from '@/lib/use-collection'
import type { Program, WorkoutSession } from '@/types'
import { useStartTemplate } from './use-start-template'
import { isSetLogged, useWorkoutSessions } from './use-workout-sessions'
import { useWorkoutTemplates } from './use-workout-templates'

export function usePrograms() {
  return useUserCollection<Omit<Program, 'id'>>('programs')
}

export interface ProgramProgress {
  /** Slot index of the workout to do next. */
  nextIndex: number
  /** Program workouts logged since the program was activated. */
  doneCount: number
  /** Most recent logged date per slot, if any (since activation). */
  lastDoneBySlot: (string | undefined)[]
  /** 1-based week of the program, counted from startDate. */
  week: number
  /** True once lengthWeeks (if set) has passed. */
  finished: boolean
  /** Slot indexes of program workouts already in today's session (logged or
   * just started) — so "Next up" offers Continue instead of a duplicate. */
  todaySlots: number[]
}

/**
 * Works out where you are in a program's rotation from what you've actually
 * logged. Each started saved workout lands in a session as a block whose
 * `blockId` is its start timestamp and whose `templateId` points back at
 * the saved workout, so walking those blocks in time order after the
 * program's anchor replays the rotation. Doing the expected workout
 * advances one step; doing a different workout from the same program (out
 * of order) jumps to just after it. Blocks with nothing actually logged
 * don't advance anything, so starting and abandoning a workout is harmless.
 */
export function programProgress(
  program: Pick<Program, 'slots' | 'anchorIndex' | 'anchorAt' | 'startDate' | 'lengthWeeks'>,
  sessions: WorkoutSession[],
  today = new Date(),
): ProgramProgress {
  const n = program.slots.length
  const todayISO = format(today, 'yyyy-MM-dd')
  const blocks: { at: number; date: string; templateId: string; logged: boolean }[] = []
  for (const session of sessions) {
    const seen = new Map<string, { templateId: string; logged: boolean }>()
    for (const entry of session.entries) {
      if (!entry.blockId || !entry.templateId) continue
      const cur = seen.get(entry.blockId) ?? { templateId: entry.templateId, logged: false }
      cur.logged ||= entry.sets.some(isSetLogged)
      seen.set(entry.blockId, cur)
    }
    for (const [blockId, b] of seen) {
      const at = Number(blockId)
      if (Number.isFinite(at)) blocks.push({ at, date: session.date, ...b })
    }
  }
  blocks.sort((a, b) => a.at - b.at)

  let pointer = n > 0 ? program.anchorIndex % n : 0
  let doneCount = 0
  const lastDoneBySlot: (string | undefined)[] = Array(n).fill(undefined)
  const todaySlots: number[] = []
  for (const block of blocks) {
    if (block.at <= program.anchorAt || n === 0) continue
    // Prefer the expected slot; otherwise the nearest matching slot ahead.
    let slot = -1
    for (let k = 0; k < n; k++) {
      const i = (pointer + k) % n
      if (program.slots[i].templateId === block.templateId) {
        slot = i
        break
      }
    }
    if (slot === -1) continue
    if (block.date === todayISO) todaySlots.push(slot)
    if (!block.logged) continue
    lastDoneBySlot[slot] = block.date
    doneCount++
    pointer = (slot + 1) % n
  }

  const week = Math.max(1, Math.floor(differenceInCalendarDays(today, parseISO(program.startDate)) / 7) + 1)
  return {
    nextIndex: pointer,
    doneCount,
    lastDoneBySlot,
    week,
    finished: program.lengthWeeks != null && week > program.lengthWeeks,
    todaySlots,
  }
}

export type ProgramDraft = Pick<Program, 'name' | 'slots' | 'lengthWeeks'>

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Shared state for any "Next up" surface: the active program, where you
 * are in it, and actions to start / skip / re-point the rotation. */
export function useActiveProgram() {
  const { items: programs, add, update, remove } = usePrograms()
  const { items: sessions } = useWorkoutSessions()
  const { items: templates } = useWorkoutTemplates()
  const startTemplate = useStartTemplate()
  const active = programs.find((p) => p.active)
  const templatesById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates])
  const progress = useMemo(() => (active ? programProgress(active, sessions) : null), [active, sessions])

  function setNext(index: number) {
    if (!active) return
    const now = Date.now()
    update(active.id, { anchorIndex: index, anchorAt: now, updatedAt: now })
  }

  function activate(id: string) {
    const now = Date.now()
    for (const p of programs) {
      if (p.id !== id && p.active) update(p.id, { active: false, updatedAt: now })
    }
    update(id, { active: true, startDate: todayISO(), anchorIndex: 0, anchorAt: now, updatedAt: now })
  }

  return {
    programs,
    active,
    progress,
    templatesById,
    startTemplate,
    setNext,
    activate,
    deactivate: (id: string) => update(id, { active: false, updatedAt: Date.now() }),
    // A first program starts right away; later ones wait to be activated.
    create: (draft: ProgramDraft) => {
      const now = Date.now()
      return add({ ...draft, active: !active, startDate: todayISO(), anchorIndex: 0, anchorAt: now, createdAt: now, updatedAt: now })
    },
    save: (id: string, draft: ProgramDraft) => update(id, { ...draft, updatedAt: Date.now() }),
    remove,
  }
}
