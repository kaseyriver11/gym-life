import clsx from 'clsx'
import { addDays, format, parseISO } from 'date-fns'
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  History,
  Link2,
  ListPlus,
  MoveDown,
  MoveUp,
  NotebookPen,
  NotebookText,
  PersonStanding,
  Square,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { inputClass } from '@/components/form'
import type { MuscleTarget, WorkoutExerciseEntry, WorkoutSession } from '@/types'
import { ComposeWorkoutModal } from './ComposeWorkoutModal'
import { ExerciseFocusModal } from './ExerciseFocusModal'
import { muscleGroupStyle } from './muscle-groups'
import { MuscleMapModal } from './MuscleMapModal'
import { buildMuscleData } from './muscle-heat'
import { PlateCalcModal } from './PlateCalcModal'
import { bestEstimatedOneRepMax, estimatedOneRepMax } from './prs'
import { suggestDefaultRpe, suggestSets } from './progression'
import { RestTimerBar } from './RestTimerBar'
import { useAllExercises } from './use-all-exercises'
import { formatTime, useRestTimer, type RestTimer } from './use-rest-timer'
import { useWorkoutSessions } from './use-workout-sessions'
import { WarmupCalcModal } from './WarmupCalcModal'
import { WorkoutHistoryModal } from './WorkoutHistoryModal'

type ExerciseInfo = {
  id: string
  name: string
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
  notes?: string
  targetMuscles?: MuscleTarget[]
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** Enter/Done on a numeric keypad should dismiss the field like a real form,
 * not leave the user to tap elsewhere to close the keyboard. */
function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') e.currentTarget.blur()
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString()
  const ss = seconds.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function WorkoutTimerBar({ session, onToggle }: { session: WorkoutSession; onToggle: () => void }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (session.endedAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [session.endedAt])

  const elapsedSeconds = Math.max(
    0,
    Math.floor(((session.endedAt ?? now) - session.createdAt) / 1000),
  )

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2">
      <span className="flex items-center gap-1.5 text-xs tabular-nums text-neutral-400">
        <Clock size={13} />
        {formatDuration(elapsedSeconds)}
        {session.endedAt && <span className="text-neutral-600">&nbsp;· finished</span>}
      </span>
      <button onClick={onToggle} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
        {session.endedAt ? 'Reopen' : 'Finish workout'}
      </button>
    </div>
  )
}

export function LogTab({ onGoToPlan }: { onGoToPlan: () => void }) {
  const [date, setDate] = useState(todayISO())
  const { items: sessions, add, update } = useWorkoutSessions()
  const { items: exercises, add: addExercise, saveNote } = useAllExercises()
  const session = sessions.find((s) => s.date === date)
  const [composing, setComposing] = useState(false)
  const [quickLogging, setQuickLogging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const timer = useRestTimer()

  function createSession(selected: ExerciseInfo[]) {
    const now = Date.now()
    add({
      date,
      entries: selected.map((ex) => {
        const sets = suggestSets(sessions, ex.id, ex)
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: sets.map((s) => ({
            ...s,
            completed: false,
            isEstimate: s.reps > 0 || s.weight > 0,
          })),
        }
      }),
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-medium text-neutral-50">
            {format(parseISO(date), 'EEEE, MMM d')}
          </p>
          <button
            onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          aria-label="Workout history"
        >
          <History size={18} />
        </button>
      </div>

      {session && (
        <WorkoutTimerBar
          session={session}
          onToggle={() => update(session.id, { endedAt: session.endedAt ? undefined : Date.now() })}
        />
      )}
      {session && <RestTimerBar timer={timer} />}

      {!session ? (
        <div className="space-y-2">
          <button
            onClick={() => setComposing(true)}
            className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-neutral-700 py-6 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
          >
            <ListPlus size={20} />
            <span className="text-sm font-medium">Compose a workout</span>
            <span className="text-xs text-neutral-600">
              Pick the exercises you're doing today, then log as you go
            </span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setQuickLogging(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-xs text-neutral-500 hover:text-neutral-300"
            >
              <Dumbbell size={13} /> Log one exercise
            </button>
            <button
              onClick={onGoToPlan}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-xs text-neutral-500 hover:text-neutral-300"
            >
              <NotebookText size={13} /> Start a saved workout
            </button>
          </div>
        </div>
      ) : (
        <SessionEditor
          session={session}
          sessions={sessions}
          exercises={exercises}
          onSave={(entries) => update(session.id, { entries, updatedAt: Date.now() })}
          timer={timer}
          onCreateExercise={addExercise}
          onSaveNote={saveNote}
          suggestSetsFor={(exerciseId, exercise) => suggestSets(sessions, exerciseId, exercise)}
        />
      )}

      {composing && (
        <ComposeWorkoutModal
          title="Compose your workout"
          confirmLabel={(n) => `Start workout · ${plural(n, 'exercise')}`}
          exercises={exercises}
          excludeIds={new Set()}
          onClose={() => setComposing(false)}
          onCreateExercise={addExercise}
          onConfirm={(selected) => {
            createSession(selected)
            setComposing(false)
          }}
        />
      )}

      {quickLogging && (
        <ComposeWorkoutModal
          title="Log an exercise"
          confirmLabel={(n) => (n <= 1 ? 'Log it' : `Log ${n} exercises`)}
          exercises={exercises}
          excludeIds={new Set()}
          onClose={() => setQuickLogging(false)}
          onCreateExercise={addExercise}
          onConfirm={(selected) => {
            createSession(selected)
            setQuickLogging(false)
          }}
        />
      )}

      {showHistory && (
        <WorkoutHistoryModal
          sessions={sessions}
          onSelect={(pickedDate) => {
            setDate(pickedDate)
            setShowHistory(false)
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

function SessionEditor({
  session,
  sessions,
  exercises,
  onSave,
  timer,
  onCreateExercise,
  onSaveNote,
  suggestSetsFor,
}: {
  session: WorkoutSession
  sessions: WorkoutSession[]
  exercises: ExerciseInfo[]
  onSave: (entries: WorkoutExerciseEntry[]) => void
  timer: RestTimer
  onCreateExercise: (data: {
    name: string
    muscleGroup: string
    equipment?: string
    createdAt: number
  }) => Promise<{ id: string }>
  onSaveNote: (
    exerciseId: string,
    data: { notes?: string; targetMuscles?: MuscleTarget[] },
  ) => void
  suggestSetsFor: (
    exerciseId: string,
    exercise?: ExerciseInfo,
  ) => { reps: number; weight: number }[]
}) {
  const [entries, setEntries] = useState(session.entries)
  const [addingMore, setAddingMore] = useState(false)
  const [timingTarget, setTimingTarget] = useState<{ entryIndex: number; setIndex: number } | null>(
    null,
  )
  const [calcWeight, setCalcWeight] = useState<number | null>(null)
  const [warmupWeight, setWarmupWeight] = useState<number | null>(null)
  const [showMuscleMap, setShowMuscleMap] = useState(false)
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<number | null>(null)
  const [focusEntryIndex, setFocusEntryIndex] = useState<number | null>(null)
  const confirmDeleteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function requestRemoveEntry(index: number) {
    if (confirmDeleteEntry === index) {
      if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
      setConfirmDeleteEntry(null)
      removeEntry(index)
      return
    }
    setConfirmDeleteEntry(index)
    if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
    confirmDeleteTimeout.current = setTimeout(() => setConfirmDeleteEntry(null), 2500)
  }
  const exercisesById = useMemo(
    () => new Map(exercises.map((ex) => [ex.id, ex])),
    [exercises],
  )
  const anySetCompleted = useMemo(
    () => entries.some((e) => e.sets.some((s) => s.completed)),
    [entries],
  )
  const groupLabels = useMemo(() => {
    const map = new Map<number, string>()
    for (const entry of entries) {
      if (entry.supersetGroup != null && !map.has(entry.supersetGroup)) {
        map.set(entry.supersetGroup, String.fromCharCode(65 + map.size))
      }
    }
    return map
  }, [entries])
  // Consecutive entries sharing a supersetGroup render inside one bracketed
  // wrapper instead of each carrying its own inline "Superset A" badge.
  const groupedEntries = useMemo(() => {
    const groups: {
      key: string
      items: { entry: WorkoutExerciseEntry; index: number }[]
    }[] = []
    entries.forEach((entry, index) => {
      const last = groups[groups.length - 1]
      const lastItem = last?.items[last.items.length - 1]
      if (
        entry.supersetGroup != null &&
        lastItem &&
        lastItem.entry.supersetGroup === entry.supersetGroup
      ) {
        last.items.push({ entry, index })
      } else {
        groups.push({ key: `${entry.exerciseId}-${index}`, items: [{ entry, index }] })
      }
    })
    return groups
  }, [entries])

  // Reset local edit buffer when switching to a different session/day.
  useEffect(() => {
    setEntries(session.entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  useEffect(() => {
    return () => {
      if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
    }
  }, [])

  function commit(next: WorkoutExerciseEntry[]) {
    setEntries(next)
    onSave(next)
  }

  function removeEntry(index: number) {
    const groupId = entries[index].supersetGroup
    commit(clearOrphanedGroup(entries.filter((_, i) => i !== index), groupId))
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= entries.length) return
    const next = [...entries]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function linkWithNext(entryIndex: number) {
    const a = entries[entryIndex]
    const b = entries[entryIndex + 1]
    if (!b) return
    const groupId =
      a.supersetGroup ??
      b.supersetGroup ??
      1 + Math.max(0, ...entries.map((e) => e.supersetGroup ?? 0))
    const next = entries.map((e, i) =>
      i === entryIndex || i === entryIndex + 1 ? { ...e, supersetGroup: groupId } : e,
    )
    commit(next)
  }

  function unlinkFromGroup(entryIndex: number) {
    const groupId = entries[entryIndex].supersetGroup
    const next = entries.map((e, i) =>
      i === entryIndex ? { ...e, supersetGroup: undefined } : e,
    )
    commit(clearOrphanedGroup(next, groupId))
  }

  /** A superset of one exercise isn't a superset — clear the tag off
   * whichever entry is left once its partner is removed or unlinked. */
  function clearOrphanedGroup(list: WorkoutExerciseEntry[], groupId?: number) {
    if (groupId == null) return list
    const remaining = list.filter((e) => e.supersetGroup === groupId)
    if (remaining.length !== 1) return list
    return list.map((e) => (e.supersetGroup === groupId ? { ...e, supersetGroup: undefined } : e))
  }

  /** Rest only auto-starts after the last exercise in a superset chain —
   * exercises outside any superset always count as "last". */
  function isLastInGroup(entryIndex: number): boolean {
    const groupId = entries[entryIndex].supersetGroup
    if (groupId == null) return true
    const indices = entries.reduce<number[]>(
      (acc, e, i) => (e.supersetGroup === groupId ? [...acc, i] : acc),
      [],
    )
    return entryIndex === Math.max(...indices)
  }

  function addSet(entryIndex: number) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? { ...entry, sets: [...entry.sets, { reps: 0, weight: 0, completed: false }] }
        : entry,
    )
    commit(next)
  }

  /** For unilateral exercises — adds a left/right pair instead of one
   * bilateral set, so each side is logged and progressed independently. */
  function addSetPair(entryIndex: number) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? {
            ...entry,
            sets: [
              ...entry.sets,
              { reps: 0, weight: 0, completed: false, side: 'left' as const },
              { reps: 0, weight: 0, completed: false, side: 'right' as const },
            ],
          }
        : entry,
    )
    commit(next)
  }

  function updateSet(
    entryIndex: number,
    setIndex: number,
    patch: Partial<WorkoutExerciseEntry['sets'][number]>,
  ) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? {
            ...entry,
            sets: entry.sets.map((set, j) => (j === setIndex ? { ...set, ...patch } : set)),
          }
        : entry,
    )
    commit(next)
  }

  function removeSet(entryIndex: number, setIndex: number) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? { ...entry, sets: entry.sets.filter((_, j) => j !== setIndex) }
        : entry,
    )
    commit(next)
  }

  function isSetPr(entryIndex: number, setIndex: number): boolean {
    const entry = entries[entryIndex]
    const set = entry.sets[setIndex]
    if (!set.completed) return false
    const candidate = estimatedOneRepMax(set.weight, set.reps)
    if (candidate <= 0) return false
    const historyBest = bestEstimatedOneRepMax(sessions, entry.exerciseId, session.id)
    const todayBest = entry.sets.reduce((max, s, i) => {
      if (i === setIndex || !s.completed) return max
      return Math.max(max, estimatedOneRepMax(s.weight, s.reps))
    }, 0)
    return candidate > Math.max(historyBest, todayBest)
  }

  function renderCard(entry: WorkoutExerciseEntry, entryIndex: number) {
        const info = exercisesById.get(entry.exerciseId)
        const style = muscleGroupStyle(info?.muscleGroup)
        return (
        <div
          key={`${entry.exerciseId}-${entryIndex}`}
          className={clsx(
            'rounded-xl border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 bg-neutral-900 p-3',
            style.border,
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  style.badge,
                )}
              >
                {entryIndex + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-100">{entry.exerciseName}</p>
                {(info?.muscleGroup || info?.equipment || entry.supersetGroup != null) && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {info?.muscleGroup && (
                      <span className={clsx('text-[11px] font-medium', style.text)}>
                        {info.muscleGroup}
                      </span>
                    )}
                    {info?.equipment && (
                      <span className="flex items-center gap-0.5 text-[11px] text-neutral-500">
                        <Dumbbell size={10} /> {info.equipment}
                      </span>
                    )}
                    {entry.supersetGroup != null && (
                      <button
                        onClick={() => unlinkFromGroup(entryIndex)}
                        className="flex items-center gap-0.5 rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-medium text-teal-300 hover:bg-teal-500/30"
                        title="Unlink from superset"
                      >
                        <Link2 size={9} /> Superset {groupLabels.get(entry.supersetGroup)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center text-neutral-600">
              <button
                onClick={() => setFocusEntryIndex(entryIndex)}
                className={clsx(
                  'flex h-8 w-8 items-center justify-center hover:text-teal-400',
                  info?.notes || info?.targetMuscles ? 'text-teal-500' : 'text-neutral-600',
                )}
                aria-label="Focus this exercise"
                title="Notes, muscle targets, and history for this exercise"
              >
                <NotebookPen size={15} />
              </button>
              <button
                onClick={() => setWarmupWeight(entry.sets[0]?.weight || 0)}
                className="flex h-8 w-8 items-center justify-center hover:text-orange-400"
                aria-label="Warm-up calculator"
                title="Suggest a warm-up ramp for this exercise"
              >
                <Flame size={15} />
              </button>
              <button
                onClick={() => moveEntry(entryIndex, -1)}
                disabled={entryIndex === 0}
                className="flex h-8 w-8 items-center justify-center hover:text-neutral-300 disabled:opacity-30"
                aria-label="Move up"
              >
                <MoveUp size={15} />
              </button>
              <button
                onClick={() => moveEntry(entryIndex, 1)}
                disabled={entryIndex === entries.length - 1}
                className="flex h-8 w-8 items-center justify-center hover:text-neutral-300 disabled:opacity-30"
                aria-label="Move down"
              >
                <MoveDown size={15} />
              </button>
              {confirmDeleteEntry === entryIndex ? (
                <button
                  onClick={() => requestRemoveEntry(entryIndex)}
                  className="ml-1 flex h-8 items-center justify-center rounded-full bg-red-500/20 px-2.5 text-[11px] font-semibold text-red-400"
                >
                  Confirm?
                </button>
              ) : (
                <button
                  onClick={() => requestRemoveEntry(entryIndex)}
                  className="ml-1 flex h-8 w-8 items-center justify-center hover:text-red-400"
                  aria-label="Remove exercise"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            {entry.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex items-center gap-2">
                <span
                  className={clsx(
                    'w-4 text-xs',
                    set.side ? 'font-semibold text-teal-400' : 'text-neutral-500',
                  )}
                  title={set.side === 'left' ? 'Left side' : set.side === 'right' ? 'Right side' : undefined}
                >
                  {set.side ? (set.side === 'left' ? 'L' : 'R') : setIndex + 1}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="reps"
                  value={set.reps || ''}
                  onChange={(e) =>
                    updateSet(entryIndex, setIndex, {
                      reps: Number(e.target.value) || 0,
                      isEstimate: false,
                    })
                  }
                  onKeyDown={blurOnEnter}
                  className={clsx(
                    `${inputClass} py-1.5`,
                    set.isEstimate && 'text-neutral-500',
                  )}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="lbs"
                  value={set.weight || ''}
                  onChange={(e) =>
                    updateSet(entryIndex, setIndex, {
                      weight: Number(e.target.value) || 0,
                      isEstimate: false,
                    })
                  }
                  onKeyDown={blurOnEnter}
                  className={clsx(
                    `${inputClass} py-1.5`,
                    set.isEstimate && 'text-neutral-500',
                  )}
                />
                <button
                  onClick={() => setCalcWeight(set.weight)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-600 hover:text-indigo-400"
                  aria-label="Plate calculator"
                >
                  <Calculator size={15} />
                </button>
                <button
                  onClick={() => {
                    const nowCompleted = !set.completed
                    const patch: Partial<typeof set> = {
                      completed: nowCompleted,
                      isEstimate: false,
                    }
                    if (nowCompleted && set.rpe == null) {
                      const priorReps = entry.sets
                        .slice(0, setIndex)
                        .filter((s) => s.completed)
                        .map((s) => s.reps)
                      patch.rpe = suggestDefaultRpe(
                        set.reps,
                        priorReps,
                        info?.repRangeLow,
                        info?.repRangeHigh,
                      )
                    }
                    updateSet(entryIndex, setIndex, patch)
                    if (nowCompleted && isLastInGroup(entryIndex)) timer.start()
                  }}
                  className={`h-7 w-7 shrink-0 rounded-full border-2 ${
                    set.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600'
                  }`}
                  aria-label="Set completed"
                />
                {set.completed && (
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={10}
                    step={0.5}
                    title="RPE — how hard did that feel? (1-10)"
                    placeholder="RPE"
                    value={set.rpe ?? ''}
                    onChange={(e) =>
                      updateSet(entryIndex, setIndex, {
                        rpe: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    onKeyDown={blurOnEnter}
                    className="w-11 shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-1 py-1.5 text-center text-xs text-neutral-50 outline-none focus:border-indigo-500"
                  />
                )}
                {isSetPr(entryIndex, setIndex) && (
                  <span title="New estimated 1RM personal record" className="shrink-0">
                    <Trophy size={13} className="text-amber-400" aria-label="New personal record" />
                  </span>
                )}
                {(() => {
                  const isTiming =
                    timingTarget?.entryIndex === entryIndex && timingTarget.setIndex === setIndex
                  if (isTiming) {
                    return (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            updateSet(entryIndex, setIndex, { durationSeconds: timer.elapsed })
                            setTimingTarget(null)
                            timer.reset()
                          }}
                          className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium tabular-nums text-teal-300"
                        >
                          <Square size={10} /> {formatTime(timer.elapsed)}
                        </button>
                        <button
                          onClick={() => {
                            setTimingTarget(null)
                            timer.reset()
                          }}
                          className="text-neutral-600 hover:text-red-400"
                          aria-label="Cancel timing"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )
                  }
                  if (set.durationSeconds) {
                    return (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setTimingTarget({ entryIndex, setIndex })
                            timer.startStopwatch(entry.exerciseName)
                          }}
                          disabled={!timer.idle}
                          className="flex h-8 items-center gap-1 text-xs text-neutral-400 hover:text-teal-400 disabled:opacity-40"
                        >
                          <Clock size={12} /> {formatTime(set.durationSeconds)}
                        </button>
                        <button
                          onClick={() => updateSet(entryIndex, setIndex, { durationSeconds: undefined })}
                          className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-700 hover:text-red-400"
                          aria-label="Clear time"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    )
                  }
                  return (
                    <button
                      onClick={() => {
                        setTimingTarget({ entryIndex, setIndex })
                        timer.startStopwatch(entry.exerciseName)
                      }}
                      disabled={!timer.idle}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-600 hover:text-teal-400 disabled:opacity-30"
                      aria-label="Time this set"
                    >
                      <Clock size={15} />
                    </button>
                  )
                })()}
                <button
                  onClick={() => removeSet(entryIndex, setIndex)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-700 hover:text-red-400"
                  aria-label="Remove set"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => addSet(entryIndex)} className="text-xs text-indigo-400 hover:underline">
                + Add set
              </button>
              <button
                onClick={() => addSetPair(entryIndex)}
                className="text-xs text-teal-400 hover:underline"
                title="Add a left + right pair for a unilateral exercise"
              >
                + Add L/R
              </button>
            </div>
            {entryIndex < entries.length - 1 &&
              !(
                entry.supersetGroup != null &&
                entry.supersetGroup === entries[entryIndex + 1].supersetGroup
              ) && (
                <button
                  onClick={() => linkWithNext(entryIndex)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-teal-400"
                  title="Link with the next exercise as a superset — rest only starts after both are done"
                >
                  <Link2 size={12} /> Link with next
                </button>
              )}
          </div>
        </div>
        )
  }

  return (
    <div className="space-y-3">
      {groupedEntries.map((group) =>
        group.items.length > 1 ? (
          <div
            key={group.key}
            className="relative space-y-1.5 rounded-xl bg-teal-500/[0.04] py-1.5 pl-4 pr-1.5"
          >
            <div className="absolute bottom-3 left-2 top-3 w-0.5 rounded-full bg-teal-500/70" />
            {group.items.map(({ entry, index }) => renderCard(entry, index))}
          </div>
        ) : (
          renderCard(group.items[0].entry, group.items[0].index)
        ),
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-neutral-900 bg-neutral-950/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          onClick={() => setAddingMore(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          <ListPlus size={16} /> Add another exercise
        </button>
        {entries.length > 0 && (
          <button
            onClick={() => setShowMuscleMap(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 text-sm text-neutral-400 hover:border-teal-500 hover:text-teal-400"
            aria-label="Muscle map"
            title="Which muscles today's session hits"
          >
            <PersonStanding size={16} />
          </button>
        )}
      </div>

      {addingMore && (
        <ComposeWorkoutModal
          title="Add to workout"
          confirmLabel={(n) => `Add ${plural(n, 'exercise')}`}
          exercises={exercises}
          excludeIds={new Set(entries.map((e) => e.exerciseId))}
          onClose={() => setAddingMore(false)}
          onCreateExercise={onCreateExercise}
          onConfirm={(selected) => {
            commit([
              ...entries,
              ...selected.map((ex) => {
                const sets = suggestSetsFor(ex.id, ex)
                return {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  sets: sets.map((s) => ({
                    ...s,
                    completed: false,
                    isEstimate: s.reps > 0 || s.weight > 0,
                  })),
                }
              }),
            ])
            setAddingMore(false)
          }}
        />
      )}

      {calcWeight != null && (
        <PlateCalcModal initialWeight={calcWeight} onClose={() => setCalcWeight(null)} />
      )}

      {warmupWeight != null && (
        <WarmupCalcModal initialWeight={warmupWeight} onClose={() => setWarmupWeight(null)} />
      )}

      {focusEntryIndex != null &&
        entries[focusEntryIndex] &&
        (() => {
          const entry = entries[focusEntryIndex]
          const info = exercisesById.get(entry.exerciseId)
          return (
            <ExerciseFocusModal
              exercise={{
                id: entry.exerciseId,
                name: entry.exerciseName,
                notes: info?.notes,
                targetMuscles: info?.targetMuscles,
              }}
              sessions={sessions}
              excludeSessionId={session.id}
              onSaveNote={(data) => onSaveNote(entry.exerciseId, data)}
              onClose={() => setFocusEntryIndex(null)}
            />
          )
        })()}

      {showMuscleMap && (
        <MuscleMapModal
          title="Today's muscle map"
          data={buildMuscleData(
            entries.map((e) => {
              const completedCount = e.sets.filter((s) => s.completed).length
              return {
                exerciseId: e.exerciseId,
                exerciseName: e.exerciseName,
                // Before anything's checked off, show the planned session
                // (like the Plan tab preview) instead of an empty map —
                // completed counts take over once a set is logged.
                setCount: anySetCompleted ? completedCount : e.sets.length,
              }
            }),
            exercisesById,
          )}
          onClose={() => setShowMuscleMap(false)}
        />
      )}
    </div>
  )
}
