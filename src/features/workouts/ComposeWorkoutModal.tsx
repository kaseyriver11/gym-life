import clsx from 'clsx'
import { Ban, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { MuscleTarget } from '@/types'
import { EQUIPMENT_TYPES, type Equipment } from './equipment'
import { MUSCLE_GROUPS, muscleGroupStyle, type MuscleGroup } from './muscle-groups'
import { MuscleRolePicker } from './MuscleRolePicker'

interface ExerciseOption {
  id: string
  name: string
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
  targetMuscles?: { muscle: string; role: 'primary' | 'secondary' | 'stabilizer' }[]
  source?: 'catalog' | 'custom'
}

function primaryMuscleLine(ex: ExerciseOption) {
  const primaries = ex.targetMuscles?.filter((t) => t.role === 'primary').map((t) => t.muscle)
  return primaries && primaries.length > 0 ? primaries.join(', ') : null
}

export function ComposeWorkoutModal({
  title,
  confirmLabel,
  exercises,
  excludeIds,
  restrictedIds,
  offerSaveAsTemplate,
  defaultGroupFilter,
  singleSelect,
  onClose,
  onConfirm,
  onCreateExercise,
}: {
  title: string
  confirmLabel: (count: number) => string
  exercises: ExerciseOption[]
  excludeIds: Set<string>
  /** When provided, these exercises are shown but greyed out and unpickable
   * — the "off limits" marker only applies while building a plan, not
   * while just logging, so this is only passed in from the Plan tab. */
  restrictedIds?: Set<string>
  /** Pre-selects a muscle-group filter pill (e.g. "Cardio" for the quick
   * cardio-add entry points) instead of opening on the unfiltered list. */
  defaultGroupFilter?: string
  /** Picking an exercise replaces the current selection instead of adding
   * to it, and hides the multi-pick-only extras ("sets per exercise", "save
   * as a reusable workout") — for a one-for-one swap (e.g. "Switch
   * exercise") rather than building up a list. */
  singleSelect?: boolean
  /** Shows an optional "Also save as a reusable workout" checkbox — only
   * makes sense where confirming actually starts/logs a session (the main
   * "Compose a workout" entry point), not for "add more to what's already
   * running" or for Plan's own template-building picker. */
  offerSaveAsTemplate?: boolean
  onClose: () => void
  /** `setsCount` is set only when the user overrode the default "Sets per
   * exercise" field below — undefined means "use the usual suggestion".
   * `templateName` is set only when offerSaveAsTemplate was on and the user
   * checked it — the caller is expected to also save a WorkoutTemplate. */
  onConfirm: (selected: ExerciseOption[], setsCount?: number, templateName?: string) => void
  /** When provided, shows a "new exercise" quick-add so the user never has
   * to leave this picker to build out their library. */
  onCreateExercise?: (data: {
    name: string
    muscleGroup: string
    equipment?: string
    createdAt: number
    targetMuscles?: MuscleTarget[]
  }) => Promise<{ id: string }>
}) {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string | null>(defaultGroupFilter ?? null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup | null>(null)
  const [newEquipment, setNewEquipment] = useState<Equipment | null>(null)
  const [newTargetMuscles, setNewTargetMuscles] = useState<MuscleTarget[]>([])
  const [setsCount, setSetsCount] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  // Newly created exercises land here immediately so confirm() can find them
  // even if the parent's `exercises` list hasn't refreshed from Firestore
  // yet — otherwise a just-created exercise can silently vanish from the
  // selection the moment "confirm" is clicked.
  const [createdExercises, setCreatedExercises] = useState<ExerciseOption[]>([])

  const allExercises = useMemo(
    () => [...exercises, ...createdExercises.filter((c) => !exercises.some((ex) => ex.id === c.id))],
    [exercises, createdExercises],
  )
  const available = allExercises.filter((ex) => !excludeIds.has(ex.id))

  const groupsPresent = useMemo(
    () => MUSCLE_GROUPS.filter((g) => available.some((ex) => ex.muscleGroup === g)),
    [available],
  )

  const filtered = available.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesGroup = !groupFilter || ex.muscleGroup === groupFilter
    return matchesSearch && matchesGroup
  })

  function toggle(id: string) {
    if (restrictedIds?.has(id)) return
    if (singleSelect) {
      setSelectedIds((prev) => (prev[0] === id ? [] : [id]))
      return
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function confirm() {
    const selected = selectedIds
      .map((id) => allExercises.find((ex) => ex.id === id))
      .filter((ex): ex is ExerciseOption => ex != null)
    const count = Number(setsCount)
    onConfirm(
      selected,
      count > 0 ? count : undefined,
      saveAsTemplate && templateName.trim() ? templateName.trim() : undefined,
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newGroup || !onCreateExercise) return
    const data = {
      name: newName.trim(),
      muscleGroup: newGroup,
      equipment: newEquipment ?? undefined,
      createdAt: Date.now(),
      targetMuscles: newTargetMuscles.length > 0 ? newTargetMuscles : undefined,
    }
    const ref = await onCreateExercise(data)
    setCreatedExercises((prev) => [
      ...prev,
      { id: ref.id, ...data, source: 'custom' as const },
    ])
    setSelectedIds((prev) => [...prev, ref.id])
    setCreating(false)
    setNewName('')
    setNewGroup(null)
    setNewEquipment(null)
    setNewTargetMuscles([])
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            autoFocus
            placeholder="Search exercises"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>

        {groupsPresent.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setGroupFilter(null)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                groupFilter === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
              )}
            >
              All
            </button>
            {groupsPresent.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setGroupFilter(group)}
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  groupFilter === group
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                )}
              >
                {group}
              </button>
            ))}
          </div>
        )}

        {allExercises.length > 0 && (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto">
            {filtered.map((ex) => {
              const checked = selectedIds.includes(ex.id)
              const restricted = restrictedIds?.has(ex.id) ?? false
              const style = muscleGroupStyle(ex.muscleGroup)
              return (
                <li key={ex.id}>
                  <button
                    type="button"
                    disabled={restricted}
                    onClick={() => toggle(ex.id)}
                    title={restricted ? 'Off-limits — cleared in Exercises to use it in a plan' : undefined}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg border-y border-r border-l-4 p-2.5 text-left transition',
                      style.border,
                      restricted && 'cursor-not-allowed opacity-40',
                      !restricted && checked
                        ? 'animate-added-flash border-y-indigo-500 border-r-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                        : 'border-y-neutral-800 border-r-neutral-800 bg-neutral-800/50 hover:border-r-neutral-700',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs text-white',
                        checked ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
                      )}
                    >
                      {checked && <span className="animate-check-pop inline-block">✓</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="block truncate text-sm text-neutral-100">{ex.name}</span>
                        {ex.source === 'catalog' && (
                          <span className="shrink-0 rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal-300">
                            Catalog
                          </span>
                        )}
                        {restricted && (
                          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-300">
                            <Ban size={9} /> Off-limits
                          </span>
                        )}
                      </span>
                      {(ex.muscleGroup || ex.equipment) && (
                        <span className="block text-xs text-neutral-500">
                          {[ex.muscleGroup, ex.equipment].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {primaryMuscleLine(ex) && (
                        <span className="block truncate text-[11px] text-neutral-600">
                          {primaryMuscleLine(ex)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-500">No matches.</p>
            )}
          </ul>
        )}

        {onCreateExercise &&
          (creating ? (
            <form
              onSubmit={handleCreate}
              className="space-y-2 rounded-lg border border-dashed border-neutral-700 p-2.5"
            >
              <input
                autoFocus
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`${inputClass} py-1.5 text-sm`}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newGroup ?? ''}
                  onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
                  className={`${inputClass} py-1.5 text-sm`}
                >
                  <option value="" disabled>
                    Muscle group…
                  </option>
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <select
                  value={newEquipment ?? ''}
                  onChange={(e) => setNewEquipment((e.target.value || null) as Equipment | null)}
                  className={`${inputClass} py-1.5 text-sm`}
                >
                  <option value="">No equipment</option>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>
              <MuscleRolePicker value={newTargetMuscles} onChange={setNewTargetMuscles} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setNewTargetMuscles([])
                  }}
                  className="flex-1 rounded-lg bg-neutral-800 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newGroup}
                  className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  Add &amp; select
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewName(search)
                setCreating(true)
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700 py-2 text-xs text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            >
              <Plus size={14} /> New exercise
            </button>
          ))}

        {!singleSelect && selectedIds.length > 0 && (
          <label className="flex items-center justify-between gap-3 text-xs text-neutral-500">
            Sets per exercise <span className="text-neutral-700">(optional — overrides suggested)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Auto"
              value={setsCount}
              onChange={(e) => setSetsCount(e.target.value)}
              className={`${inputClass} w-16 py-1 text-center text-sm`}
            />
          </label>
        )}

        {!singleSelect && offerSaveAsTemplate && selectedIds.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-dashed border-neutral-700 p-2.5">
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              Also save as a reusable workout
            </label>
            {saveAsTemplate && (
              <input
                autoFocus
                placeholder='Name, e.g. "Push Day A"'
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={`${inputClass} py-1.5 text-sm`}
              />
            )}
          </div>
        )}

        <button
          type="button"
          disabled={selectedIds.length === 0 || (saveAsTemplate && !templateName.trim())}
          onClick={confirm}
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          {confirmLabel(selectedIds.length)}
        </button>
      </div>
    </Modal>
  )
}
