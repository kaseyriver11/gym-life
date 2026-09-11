import clsx from 'clsx'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import { EQUIPMENT_TYPES, type Equipment } from './equipment'
import { MUSCLE_GROUPS, muscleGroupStyle, type MuscleGroup } from './muscle-groups'

interface ExerciseOption {
  id: string
  name: string
  muscleGroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
}

export function ComposeWorkoutModal({
  title,
  confirmLabel,
  exercises,
  excludeIds,
  onClose,
  onConfirm,
  onCreateExercise,
}: {
  title: string
  confirmLabel: (count: number) => string
  exercises: ExerciseOption[]
  excludeIds: Set<string>
  onClose: () => void
  onConfirm: (selected: ExerciseOption[]) => void
  /** When provided, shows a "new exercise" quick-add so the user never has
   * to leave this picker to build out their library. */
  onCreateExercise?: (data: {
    name: string
    muscleGroup: string
    equipment?: string
    createdAt: number
  }) => Promise<{ id: string }>
}) {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup | null>(null)
  const [newEquipment, setNewEquipment] = useState<Equipment | null>(null)

  const available = exercises.filter((ex) => !excludeIds.has(ex.id))

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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function confirm() {
    const selected = selectedIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is ExerciseOption => ex != null)
    onConfirm(selected)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newGroup || !onCreateExercise) return
    const ref = await onCreateExercise({
      name: newName.trim(),
      muscleGroup: newGroup,
      equipment: newEquipment ?? undefined,
      createdAt: Date.now(),
    })
    setSelectedIds((prev) => [...prev, ref.id])
    setCreating(false)
    setNewName('')
    setNewGroup(null)
    setNewEquipment(null)
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

        {exercises.length > 0 && (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto">
            {filtered.map((ex) => {
              const checked = selectedIds.includes(ex.id)
              const style = muscleGroupStyle(ex.muscleGroup)
              return (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => toggle(ex.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg border-y border-r border-l-4 p-2.5 text-left transition',
                      style.border,
                      checked
                        ? 'border-y-indigo-500 border-r-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                        : 'border-y-neutral-800 border-r-neutral-800 bg-neutral-800/50 hover:border-r-neutral-700',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs text-white',
                        checked ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
                      )}
                    >
                      {checked && '✓'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-neutral-100">{ex.name}</span>
                      {(ex.muscleGroup || ex.equipment) && (
                        <span className="text-xs text-neutral-500">
                          {[ex.muscleGroup, ex.equipment].filter(Boolean).join(' · ')}
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
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

        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={confirm}
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          {confirmLabel(selectedIds.length)}
        </button>
      </div>
    </Modal>
  )
}
