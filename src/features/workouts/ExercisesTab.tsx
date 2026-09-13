import clsx from 'clsx'
import {
  Ban,
  ChevronDown,
  Database,
  Dumbbell,
  Filter,
  Pencil,
  PersonStanding,
  Plus,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { Exercise, MuscleTarget } from '@/types'
import { subgroupForMuscle } from './body-map'
import { BACK_EXERCISES } from './catalog-data/back'
import { BICEPS_EXERCISES } from './catalog-data/biceps'
import { CARDIO_EXERCISES } from './catalog-data/cardio'
import { CHEST_EXERCISES } from './catalog-data/chest'
import { CORE_EXERCISES } from './catalog-data/core'
import { FOREARMS_EXERCISES } from './catalog-data/forearms'
import { GLUTES_EXERCISES } from './catalog-data/glutes'
import { LEGS_EXERCISES } from './catalog-data/legs'
import { seedCatalog } from './catalog-data/seed'
import { SHOULDERS_EXERCISES } from './catalog-data/shoulders'
import { TRICEPS_EXERCISES } from './catalog-data/triceps'
import { EQUIPMENT_ICONS, EQUIPMENT_TYPES, type Equipment } from './equipment'
import { MuscleMapModal } from './MuscleMapModal'
import { buildMuscleData } from './muscle-heat'
import { MUSCLE_GROUPS, muscleGroupStyle, type MuscleGroup } from './muscle-groups'
import { MuscleRolePicker } from './MuscleRolePicker'
import { RESTRICTION_DURATIONS, isRestricted, restrictedUntilFromMonths, restrictionLabel } from './restrictions'
import { useAllExercises, type ExerciseWithSource } from './use-all-exercises'

type Mode = 'add' | 'search'

function tagLine(ex: { muscleGroup?: string; muscleSubgroup?: string; equipment?: string }) {
  return [ex.muscleGroup, ex.muscleSubgroup, ex.equipment].filter(Boolean).join(' · ')
}

/** Dev-only tool for seeding the shared catalog — invisible in production
 * builds. Reusable for future muscle groups by adding more batches here. */
function CatalogSeedTool() {
  const [status, setStatus] = useState<string | null>(null)
  const batches: { label: string; data: Omit<Exercise, 'id'>[] }[] = [
    { label: 'Chest', data: CHEST_EXERCISES },
    { label: 'Back', data: BACK_EXERCISES },
    { label: 'Shoulders', data: SHOULDERS_EXERCISES },
    { label: 'Biceps', data: BICEPS_EXERCISES },
    { label: 'Triceps', data: TRICEPS_EXERCISES },
    { label: 'Forearms', data: FOREARMS_EXERCISES },
    { label: 'Legs', data: LEGS_EXERCISES },
    { label: 'Glutes', data: GLUTES_EXERCISES },
    { label: 'Core', data: CORE_EXERCISES },
    { label: 'Cardio', data: CARDIO_EXERCISES },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2 text-xs">
      <Database size={12} className="shrink-0 text-amber-400" />
      {batches.map((batch) => (
        <button
          key={batch.label}
          type="button"
          onClick={async () => {
            setStatus(`Seeding ${batch.label}…`)
            try {
              const count = await seedCatalog(batch.data)
              setStatus(`Seeded ${count} ${batch.label} exercises`)
            } catch (err) {
              setStatus(
                `Failed: ${err instanceof Error ? err.message : String(err)} — check Firestore rules allow writes to exerciseCatalog.`,
              )
            }
          }}
          className="rounded-full bg-amber-500/20 px-2 py-1 font-medium text-amber-300 hover:bg-amber-500/30"
        >
          Seed {batch.label} ({batch.data.length})
        </button>
      ))}
      <button
        type="button"
        onClick={async () => {
          setStatus('Seeding all…')
          try {
            let total = 0
            for (const batch of batches) {
              total += await seedCatalog(batch.data)
            }
            setStatus(`Seeded ${total} exercises across ${batches.length} groups`)
          } catch (err) {
            setStatus(
              `Failed: ${err instanceof Error ? err.message : String(err)} — check Firestore rules allow writes to exerciseCatalog.`,
            )
          }
        }}
        className="rounded-full bg-amber-500 px-2 py-1 font-semibold text-neutral-950 hover:bg-amber-400"
      >
        Seed All ({batches.reduce((sum, b) => sum + b.data.length, 0)})
      </button>
      {status && <span className="text-neutral-500">{status}</span>}
    </div>
  )
}

export function ExercisesTab() {
  const { items, add, update, remove, saveNote } = useAllExercises()
  const [mode, setMode] = useState<Mode>('add')
  const [editing, setEditing] = useState<Exercise | null>(null)

  return (
    <div className="space-y-5">
      {import.meta.env.DEV && <CatalogSeedTool />}

      <div className="flex gap-1 rounded-xl bg-neutral-900 p-1">
        <button
          onClick={() => setMode('add')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition',
            mode === 'add' ? 'bg-neutral-800 text-neutral-50' : 'text-neutral-500 hover:text-neutral-300',
          )}
        >
          <Plus size={14} /> Add
        </button>
        <button
          onClick={() => setMode('search')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition',
            mode === 'search'
              ? 'bg-neutral-800 text-neutral-50'
              : 'text-neutral-500 hover:text-neutral-300',
          )}
        >
          <Search size={14} /> Search
        </button>
      </div>

      {mode === 'add' ? (
        <AddExercisePanel items={items} add={add} onEditExisting={setEditing} />
      ) : (
        <SearchExercisePanel
          items={items}
          onEdit={setEditing}
          onRemove={remove}
          onSaveRestriction={(id, restrictedUntil) => saveNote(id, { restrictedUntil })}
        />
      )}

      {editing && (
        <EditExerciseModal
          exercise={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            update(editing.id, patch)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AddExercisePanel({
  items,
  add,
  onEditExisting,
}: {
  items: ExerciseWithSource[]
  add: (data: Omit<Exercise, 'id'>) => unknown
  onEditExisting: (exercise: Exercise) => void
}) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [repRangeLow, setRepRangeLow] = useState('')
  const [repRangeHigh, setRepRangeHigh] = useState('')
  const [targetMuscles, setTargetMuscles] = useState<MuscleTarget[]>([])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !muscleGroup) return
    add({
      name: name.trim(),
      muscleGroup,
      muscleSubgroup: subgroupForMuscle(targetMuscles.find((t) => t.role === 'primary')?.muscle),
      equipment: equipment ?? undefined,
      repRangeLow: repRangeLow ? Number(repRangeLow) : undefined,
      repRangeHigh: repRangeHigh ? Number(repRangeHigh) : undefined,
      targetMuscles: targetMuscles.length > 0 ? targetMuscles : undefined,
      createdAt: Date.now(),
    })
    setName('')
    setMuscleGroup(null)
    setEquipment(null)
    setRepRangeLow('')
    setRepRangeHigh('')
    setTargetMuscles([])
  }

  const query = name.trim().toLowerCase()
  const potentialMatches =
    query.length >= 2 ? items.filter((ex) => ex.name.toLowerCase().includes(query)) : []

  return (
    <form
      onSubmit={handleAdd}
      className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
    >
      <ExerciseFields
        name={name}
        onNameChange={setName}
        muscleGroup={muscleGroup}
        onMuscleGroupChange={setMuscleGroup}
        equipment={equipment}
        onEquipmentChange={setEquipment}
        repRangeLow={repRangeLow}
        onRepRangeLowChange={setRepRangeLow}
        repRangeHigh={repRangeHigh}
        onRepRangeHighChange={setRepRangeHigh}
        targetMuscles={targetMuscles}
        onTargetMusclesChange={setTargetMuscles}
      />

      {potentialMatches.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <TriangleAlert size={12} /> Already in your library — did you mean one of these?
          </p>
          <ul className="space-y-1">
            {potentialMatches.map((ex) =>
              ex.source === 'catalog' ? (
                <li
                  key={ex.id}
                  className="flex items-center justify-between rounded-md bg-neutral-900/60 px-2 py-1.5"
                >
                  <span className="flex items-center gap-1.5 text-sm text-neutral-200">
                    {ex.name}
                    <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal-300">
                      Catalog
                    </span>
                  </span>
                  <span className="text-xs text-neutral-500">{tagLine(ex)}</span>
                </li>
              ) : (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => onEditExisting(ex)}
                    className="flex w-full items-center justify-between rounded-md bg-neutral-900/60 px-2 py-1.5 text-left hover:bg-neutral-900"
                  >
                    <span className="text-sm text-neutral-200">{ex.name}</span>
                    <span className="text-xs text-neutral-500">{tagLine(ex)}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={!name.trim() || !muscleGroup}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
      >
        <Plus size={16} /> Add to library
      </button>
    </form>
  )
}

function SearchExercisePanel({
  items,
  onEdit,
  onRemove,
  onSaveRestriction,
}: {
  items: ExerciseWithSource[]
  onEdit: (exercise: Exercise) => void
  onRemove: (id: string) => void
  onSaveRestriction: (id: string, restrictedUntil: string | null) => void
}) {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null)
  const [restrictingExercise, setRestrictingExercise] = useState<ExerciseWithSource | null>(null)
  const [muscleMapExercise, setMuscleMapExercise] = useState<ExerciseWithSource | null>(null)

  const filtered = items.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!groupFilter || ex.muscleGroup === groupFilter) &&
      (!equipmentFilter || ex.equipment === equipmentFilter),
  )
  const groupsPresent = MUSCLE_GROUPS.filter((g) => items.some((ex) => ex.muscleGroup === g))
  const equipmentPresent = EQUIPMENT_TYPES.filter((e) => items.some((ex) => ex.equipment === e))
  const filtersActive = groupFilter || equipmentFilter || search.trim()
  const groups = groupByMuscle(filtered)

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
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
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Filter size={12} /> Filter
            </p>
            {filtersActive && (
              <button
                onClick={() => {
                  setSearch('')
                  setGroupFilter(null)
                  setEquipmentFilter(null)
                }}
                className="flex items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-300"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
          {(groupsPresent.length > 1 || equipmentPresent.length > 1) && (
            <div className="grid grid-cols-2 gap-2">
              {groupsPresent.length > 1 && (
                <div className="relative">
                  <select
                    value={groupFilter ?? ''}
                    onChange={(e) => setGroupFilter((e.target.value || null) as MuscleGroup | null)}
                    className={`${inputClass} appearance-none py-1.5 pr-8 text-sm`}
                  >
                    <option value="">All muscles</option>
                    {groupsPresent.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                </div>
              )}
              {equipmentPresent.length > 1 && (
                <div className="relative">
                  <select
                    value={equipmentFilter ?? ''}
                    onChange={(e) => setEquipmentFilter((e.target.value || null) as Equipment | null)}
                    className={`${inputClass} appearance-none py-1.5 pr-8 text-sm`}
                  >
                    <option value="">All equipment</option>
                    {equipmentPresent.map((item) => (
                      <option key={item} value={item}>
                        {EQUIPMENT_ICONS[item]} {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-500">
          No exercises yet — switch to Add to build your library.
        </p>
      )}

      {items.length > 0 && filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-500">
          No exercises match that search.
        </p>
      )}

      {groups.map(([group, exercises]) => {
        const style = muscleGroupStyle(group)
        return (
          <div key={group}>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <span className={clsx('h-2 w-2 rounded-full', style.dot)} />
              {group} <span className="text-neutral-700">· {exercises.length}</span>
            </h3>
            <ul className="space-y-2">
              {exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className={clsx(
                    'flex items-center justify-between rounded-xl border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 bg-neutral-900 p-3',
                    style.border,
                    isRestricted(exercise.restrictedUntil) && 'opacity-60',
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-neutral-100">
                      {exercise.name}
                      {exercise.source === 'catalog' && (
                        <span className="shrink-0 rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal-300">
                          Catalog
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {exercise.muscleSubgroup && (
                        <span className="text-xs text-neutral-500">{exercise.muscleSubgroup}</span>
                      )}
                      {exercise.equipment && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Dumbbell size={11} /> {EQUIPMENT_ICONS[exercise.equipment as Equipment]}{' '}
                          {exercise.equipment}
                        </span>
                      )}
                    </div>
                    {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                        {exercise.targetMuscles
                          .filter((t) => t.role === 'primary')
                          .map((t) => t.muscle)
                          .join(', ')}
                      </p>
                    )}
                    {restrictionLabel(exercise.restrictedUntil) && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-red-400">
                        <Ban size={10} /> {restrictionLabel(exercise.restrictedUntil)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => setRestrictingExercise(exercise)}
                      className={clsx(
                        isRestricted(exercise.restrictedUntil)
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-neutral-500 hover:text-red-400',
                      )}
                      aria-label="Mark off-limits"
                      title="Mark this exercise off-limits (injury, doctor's orders, etc.)"
                    >
                      <Ban size={14} />
                    </button>
                    <button
                      onClick={() => setMuscleMapExercise(exercise)}
                      className="text-neutral-500 hover:text-teal-400"
                      aria-label="Muscle map"
                      title="Which muscles this exercise hits"
                    >
                      <PersonStanding size={14} />
                    </button>
                    {exercise.source === 'catalog' ? (
                      <span className="text-[11px] text-neutral-600">Read-only</span>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(exercise)}
                          className="text-neutral-500 hover:text-indigo-400"
                          aria-label="Edit exercise"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onRemove(exercise.id)}
                          className="text-xs text-neutral-600 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {muscleMapExercise && (
        <MuscleMapModal
          title={muscleMapExercise.name}
          data={buildMuscleData(
            [{ exerciseId: muscleMapExercise.id, exerciseName: muscleMapExercise.name, setCount: 1 }],
            new Map([[muscleMapExercise.id, muscleMapExercise]]),
          )}
          onClose={() => setMuscleMapExercise(null)}
        />
      )}

      {restrictingExercise && (
        <RestrictExerciseModal
          exercise={restrictingExercise}
          onSave={(restrictedUntil) => {
            onSaveRestriction(restrictingExercise.id, restrictedUntil)
            setRestrictingExercise(null)
          }}
          onClose={() => setRestrictingExercise(null)}
        />
      )}
    </div>
  )
}

function RestrictExerciseModal({
  exercise,
  onSave,
  onClose,
}: {
  exercise: ExerciseWithSource
  onSave: (restrictedUntil: string | null) => void
  onClose: () => void
}) {
  const currentlyRestricted = isRestricted(exercise.restrictedUntil)
  return (
    <Modal title={`Off-limits: ${exercise.name}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-400">
          Hides this exercise from selection while building a plan — e.g. an injury or your
          doctor's orders. It still stays in your library and in past logs.
        </p>
        <div className="space-y-1.5">
          {RESTRICTION_DURATIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onSave(restrictedUntilFromMonths(value))}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:border-red-500 hover:text-red-300"
            >
              {label}
            </button>
          ))}
        </div>
        {currentlyRestricted && (
          <button
            onClick={() => onSave(null)}
            className="w-full rounded-lg bg-neutral-800 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700"
          >
            Clear — make available again
          </button>
        )}
      </div>
    </Modal>
  )
}

function ExerciseFields({
  name,
  onNameChange,
  muscleGroup,
  onMuscleGroupChange,
  equipment,
  onEquipmentChange,
  repRangeLow,
  onRepRangeLowChange,
  repRangeHigh,
  onRepRangeHighChange,
  targetMuscles,
  onTargetMusclesChange,
}: {
  name: string
  onNameChange: (value: string) => void
  muscleGroup: MuscleGroup | null
  onMuscleGroupChange: (value: MuscleGroup) => void
  equipment: Equipment | null
  onEquipmentChange: (value: Equipment | null) => void
  repRangeLow: string
  onRepRangeLowChange: (value: string) => void
  repRangeHigh: string
  onRepRangeHighChange: (value: string) => void
  targetMuscles: MuscleTarget[]
  onTargetMusclesChange: (value: MuscleTarget[]) => void
}) {
  return (
    <>
      <input
        autoFocus
        placeholder="Exercise name, e.g. Bench Press"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className={inputClass}
      />
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Muscle group</label>
        <select
          value={muscleGroup ?? ''}
          onChange={(e) => onMuscleGroupChange(e.target.value as MuscleGroup)}
          className={inputClass}
        >
          <option value="" disabled>
            Select…
          </option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Equipment</label>
        <select
          value={equipment ?? ''}
          onChange={(e) => onEquipmentChange((e.target.value || null) as Equipment | null)}
          className={inputClass}
        >
          <option value="">No equipment specified</option>
          {EQUIPMENT_TYPES.map((item) => (
            <option key={item} value={item}>
              {EQUIPMENT_ICONS[item]} {item}
            </option>
          ))}
        </select>
        {equipment && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium text-teal-300">
            {EQUIPMENT_ICONS[equipment]} {equipment}
          </span>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">
          Target rep range <span className="text-neutral-700">(optional, defaults to 8-12)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="8"
            value={repRangeLow}
            onChange={(e) => onRepRangeLowChange(e.target.value)}
            className={`${inputClass} py-1.5 text-center`}
          />
          <span className="text-neutral-600">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="12"
            value={repRangeHigh}
            onChange={(e) => onRepRangeHighChange(e.target.value)}
            className={`${inputClass} py-1.5 text-center`}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">
          Which muscles does this work?{' '}
          <span className="text-neutral-700">(optional — powers the muscle map)</span>
        </label>
        <MuscleRolePicker value={targetMuscles} onChange={onTargetMusclesChange} />
      </div>
    </>
  )
}

function EditExerciseModal({
  exercise,
  onClose,
  onSave,
}: {
  exercise: Exercise
  onClose: () => void
  onSave: (patch: {
    name: string
    muscleGroup: MuscleGroup
    muscleSubgroup?: string
    equipment?: Equipment
    repRangeLow?: number
    repRangeHigh?: number
    targetMuscles?: MuscleTarget[]
  }) => void
}) {
  const [name, setName] = useState(exercise.name)
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(
    (exercise.muscleGroup as MuscleGroup) ?? null,
  )
  const [equipment, setEquipment] = useState<Equipment | null>(
    (exercise.equipment as Equipment) ?? null,
  )
  const [repRangeLow, setRepRangeLow] = useState(exercise.repRangeLow?.toString() ?? '')
  const [repRangeHigh, setRepRangeHigh] = useState(exercise.repRangeHigh?.toString() ?? '')
  const [targetMuscles, setTargetMuscles] = useState<MuscleTarget[]>(
    () => exercise.targetMuscles ?? [],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !muscleGroup) return
    onSave({
      name: name.trim(),
      muscleGroup,
      muscleSubgroup: subgroupForMuscle(targetMuscles.find((t) => t.role === 'primary')?.muscle),
      equipment: equipment ?? undefined,
      repRangeLow: repRangeLow ? Number(repRangeLow) : undefined,
      repRangeHigh: repRangeHigh ? Number(repRangeHigh) : undefined,
      targetMuscles: targetMuscles.length > 0 ? targetMuscles : undefined,
    })
  }

  return (
    <Modal title="Edit exercise" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ExerciseFields
          name={name}
          onNameChange={setName}
          muscleGroup={muscleGroup}
          onMuscleGroupChange={setMuscleGroup}
          equipment={equipment}
          onEquipmentChange={setEquipment}
          repRangeLow={repRangeLow}
          onRepRangeLowChange={setRepRangeLow}
          repRangeHigh={repRangeHigh}
          onRepRangeHighChange={setRepRangeHigh}
          targetMuscles={targetMuscles}
          onTargetMusclesChange={setTargetMuscles}
        />
        <button
          type="submit"
          disabled={!name.trim() || !muscleGroup}
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          Save changes
        </button>
      </form>
    </Modal>
  )
}

function groupByMuscle<T extends { name: string; muscleGroup?: string }>(items: T[]) {
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const key = item.muscleGroup || 'Other'
    const bucket = buckets.get(key)
    if (bucket) bucket.push(item)
    else buckets.set(key, [item])
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name))
  }
  const order = [...MUSCLE_GROUPS, 'Other']
  return [...buckets.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  )
}
