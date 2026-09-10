import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { inputClass } from '@/components/form'
import type { WorkoutExerciseEntry, WorkoutSession } from '@/types'
import { useExercises } from './use-exercises'
import { useWorkoutSessions } from './use-workout-sessions'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function LogTab() {
  const [date, setDate] = useState(todayISO())
  const { items: sessions, add, update } = useWorkoutSessions()
  const { items: exercises } = useExercises()
  const session = sessions.find((s) => s.date === date)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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

      {!session ? (
        <button
          onClick={() => {
            const now = Date.now()
            add({ date, entries: [], createdAt: now, updatedAt: now })
          }}
          className="w-full rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          Start a workout for this day
        </button>
      ) : (
        <SessionEditor
          session={session}
          exercises={exercises}
          onSave={(entries) => update(session.id, { entries, updatedAt: Date.now() })}
        />
      )}
    </div>
  )
}

function SessionEditor({
  session,
  exercises,
  onSave,
}: {
  session: WorkoutSession
  exercises: { id: string; name: string }[]
  onSave: (entries: WorkoutExerciseEntry[]) => void
}) {
  const [entries, setEntries] = useState(session.entries)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Reset local edit buffer when switching to a different session/day.
  useEffect(() => {
    setEntries(session.entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  function commit(next: WorkoutExerciseEntry[]) {
    setEntries(next)
    onSave(next)
  }

  function addExercise(exerciseId: string, exerciseName: string) {
    commit([
      ...entries,
      { exerciseId, exerciseName, sets: [{ reps: 0, weight: 0, completed: false }] },
    ])
    setPickerOpen(false)
  }

  function removeEntry(index: number) {
    commit(entries.filter((_, i) => i !== index))
  }

  function addSet(entryIndex: number) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? { ...entry, sets: [...entry.sets, { reps: 0, weight: 0, completed: false }] }
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

  return (
    <div className="space-y-3">
      {entries.map((entry, entryIndex) => (
        <div
          key={`${entry.exerciseId}-${entryIndex}`}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-100">{entry.exerciseName}</p>
            <button
              onClick={() => removeEntry(entryIndex)}
              className="text-neutral-600 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            {entry.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex items-center gap-2">
                <span className="w-4 text-xs text-neutral-500">{setIndex + 1}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="reps"
                  value={set.reps || ''}
                  onChange={(e) =>
                    updateSet(entryIndex, setIndex, { reps: Number(e.target.value) || 0 })
                  }
                  className={`${inputClass} py-1.5`}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="lbs"
                  value={set.weight || ''}
                  onChange={(e) =>
                    updateSet(entryIndex, setIndex, { weight: Number(e.target.value) || 0 })
                  }
                  className={`${inputClass} py-1.5`}
                />
                <button
                  onClick={() => updateSet(entryIndex, setIndex, { completed: !set.completed })}
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    set.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600'
                  }`}
                  aria-label="Set completed"
                />
                <button
                  onClick={() => removeSet(entryIndex, setIndex)}
                  className="text-neutral-700 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addSet(entryIndex)}
            className="mt-2 text-xs text-indigo-400 hover:underline"
          >
            + Add set
          </button>
        </div>
      ))}

      {pickerOpen ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          {exercises.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Add exercises in the Exercises tab first.
            </p>
          ) : (
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => {
                const ex = exercises.find((x) => x.id === e.target.value)
                if (ex) addExercise(ex.id, ex.name)
              }}
              className={inputClass}
            >
              <option value="" disabled>
                Pick an exercise…
              </option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          <Plus size={16} /> Add exercise
        </button>
      )}
    </div>
  )
}
