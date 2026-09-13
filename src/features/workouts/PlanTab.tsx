import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { WorkoutTemplate } from '@/types'
import { ComposeWorkoutModal } from './ComposeWorkoutModal'
import { buildMuscleData, dominantMuscleLabel } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { suggestSets } from './progression'
import { isRestricted } from './restrictions'
import { useAllExercises } from './use-all-exercises'
import { useWorkoutTemplates } from './use-workout-templates'
import { useWorkoutSessions } from './use-workout-sessions'

type TemplateEntry = WorkoutTemplate['entries'][number]
type PlannedSet = TemplateEntry['plannedSets'][number]

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function formatPlannedSets(sets: PlannedSet[]) {
  const hasReal = sets.some((s) => s.reps > 0 || s.weight > 0)
  if (!hasReal) return `${sets.length} set${sets.length === 1 ? '' : 's'} · auto-suggested`
  const allSame = sets.every((s) => s.reps === sets[0].reps && s.weight === sets[0].weight)
  if (allSame) {
    return `${sets.length} × ${sets[0].reps} reps${sets[0].weight ? ` @ ${sets[0].weight} lb` : ''}`
  }
  return sets.map((s) => `${s.reps}×${s.weight || 0}`).join(', ')
}

export function PlanTab({ onStarted }: { onStarted: () => void }) {
  const { items: templates, add, update, remove } = useWorkoutTemplates()
  const { items: exercises, add: addExercise } = useAllExercises()
  const { items: sessions, add: addSession } = useWorkoutSessions()
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])

  function startTemplate(template: WorkoutTemplate) {
    const now = Date.now()
    addSession({
      date: todayISO(),
      entries: template.entries.map((entry) => {
        const hasRealPlan = entry.plannedSets.some((s) => s.reps > 0 || s.weight > 0)
        const exerciseInfo = exercises.find((ex) => ex.id === entry.exerciseId)
        const sets = hasRealPlan
          ? entry.plannedSets
          : suggestSets(sessions, entry.exerciseId, exerciseInfo)
        return {
          exerciseId: entry.exerciseId,
          exerciseName: entry.exerciseName,
          sets: sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            completed: false,
            isEstimate: s.reps > 0 || s.weight > 0,
          })),
        }
      }),
      createdAt: now,
      updatedAt: now,
    })
    onStarted()
  }

  return (
    <div className="space-y-3">
      {templates.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          No saved workouts yet. Build one — like "Push Day A" — to reuse anytime, with sets
          and weights ready to go.
        </p>
      )}

      {templates.map((template) => {
        const totalSets = template.entries.reduce((sum, e) => sum + e.plannedSets.length, 0)
        const muscleData = buildMuscleData(
          template.entries.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            setCount: e.plannedSets.length || 1,
          })),
          exercisesById,
        )
        const dominant = dominantMuscleLabel(muscleData)
        const expanded = expandedId === template.id
        return (
          <div key={template.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => setExpandedId(expanded ? null : template.id)}
                className="flex min-w-0 flex-1 items-start gap-1.5 text-left"
              >
                {expanded ? (
                  <ChevronUp size={16} className="mt-0.5 shrink-0 text-neutral-600" />
                ) : (
                  <ChevronDown size={16} className="mt-0.5 shrink-0 text-neutral-600" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-100">{template.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {template.entries.length} exercise{template.entries.length === 1 ? '' : 's'} ·{' '}
                    {totalSets} planned set{totalSets === 1 ? '' : 's'}
                    {dominant && (
                      <>
                        {' '}
                        · <span className="text-teal-400">{dominant}-dominant</span>
                      </>
                    )}
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => setEditing(template)}
                  className="text-neutral-500 hover:text-indigo-400"
                  aria-label="Edit plan"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(template.id)}
                  className="text-neutral-500 hover:text-red-400"
                  aria-label="Delete plan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expanded && (
              <div className="mt-3 border-t border-neutral-800 pt-3">
                <MuscleMapView data={muscleData} size="6.5rem" />
                <ul className="mt-3 space-y-1.5">
                  {template.entries.map((entry) => (
                    <li
                      key={entry.exerciseId}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-neutral-300">{entry.exerciseName}</span>
                      <span className="shrink-0 text-neutral-500">
                        {formatPlannedSets(entry.plannedSets)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => startTemplate(template)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Play size={14} /> Start
            </button>
          </div>
        )
      })}

      <button
        onClick={() => setShowNew(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
      >
        <Plus size={16} /> New saved workout
      </button>

      {showNew && (
        <TemplateBuilder
          exercises={exercises}
          onCreateExercise={addExercise}
          onClose={() => setShowNew(false)}
          onSave={(data) => {
            const now = Date.now()
            add({ ...data, createdAt: now, updatedAt: now })
            setShowNew(false)
          }}
        />
      )}

      {editing && (
        <TemplateBuilder
          exercises={exercises}
          existing={editing}
          onCreateExercise={addExercise}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            update(editing.id, { ...data, updatedAt: Date.now() })
            setEditing(null)
          }}
        />
      )}

    </div>
  )
}

function TemplateBuilder({
  exercises,
  existing,
  onClose,
  onSave,
  onCreateExercise,
}: {
  exercises: {
    id: string
    name: string
    muscleGroup?: string
    equipment?: string
    restrictedUntil?: string | null
  }[]
  existing?: WorkoutTemplate
  onClose: () => void
  onSave: (data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCreateExercise: (data: {
    name: string
    muscleGroup: string
    equipment?: string
    createdAt: number
  }) => Promise<{ id: string }>
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [entries, setEntries] = useState<TemplateEntry[]>(existing?.entries ?? [])
  const [picking, setPicking] = useState(false)
  const restrictedIds = useMemo(
    () => new Set(exercises.filter((ex) => isRestricted(ex.restrictedUntil)).map((ex) => ex.id)),
    [exercises],
  )

  function updateSet(exerciseId: string, setIndex: number, patch: Partial<PlannedSet>) {
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              plannedSets: e.plannedSets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)),
            }
          : e,
      ),
    )
  }

  function addSet(exerciseId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, plannedSets: [...e.plannedSets, { reps: 0, weight: 0 }] }
          : e,
      ),
    )
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, plannedSets: e.plannedSets.filter((_, i) => i !== setIndex) }
          : e,
      ),
    )
  }

  function removeEntry(exerciseId: string) {
    setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId))
  }

  function handleSave() {
    if (!name.trim() || entries.length === 0) return
    onSave({ name: name.trim(), entries })
  }

  const valid = name.trim() && entries.length > 0

  return (
    <Modal title={existing ? 'Edit saved workout' : 'New saved workout'} onClose={onClose}>
      <div className="space-y-4">
        <input
          autoFocus
          required
          placeholder='Name, e.g. "Push Day A"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">
            Exercises — planned sets are optional; leave blank to pull your numbers from last
            time you did it.
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.exerciseId} className="rounded-lg bg-neutral-800/50 p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-neutral-200">
                    {entry.exerciseName}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.exerciseId)}
                    className="text-neutral-600 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  {entry.plannedSets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-1.5">
                      <span className="w-3 text-xs text-neutral-500">{setIndex + 1}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="reps"
                        value={set.reps || ''}
                        onChange={(e) =>
                          updateSet(entry.exerciseId, setIndex, {
                            reps: Number(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} py-1 text-xs`}
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="lbs"
                        value={set.weight || ''}
                        onChange={(e) =>
                          updateSet(entry.exerciseId, setIndex, {
                            weight: Number(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} py-1 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(entry.exerciseId, setIndex)}
                        className="text-neutral-700 hover:text-red-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSet(entry.exerciseId)}
                  className="mt-1 text-xs text-indigo-400 hover:underline"
                >
                  + Add set
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700 py-2 text-xs text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
          >
            <Plus size={14} /> Add exercise
          </button>
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={handleSave}
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          {existing ? 'Save changes' : 'Save workout'}
        </button>
      </div>

      {picking && (
        <ComposeWorkoutModal
          title="Add exercises"
          confirmLabel={(n) => `Add ${n} exercise${n === 1 ? '' : 's'}`}
          exercises={exercises}
          excludeIds={new Set(entries.map((e) => e.exerciseId))}
          restrictedIds={restrictedIds}
          onClose={() => setPicking(false)}
          onCreateExercise={onCreateExercise}
          onConfirm={(selected) => {
            setEntries((prev) => [
              ...prev,
              ...selected.map((ex) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                plannedSets: [{ reps: 0, weight: 0 }],
              })),
            ])
            setPicking(false)
          }}
        />
      )}
    </Modal>
  )
}
