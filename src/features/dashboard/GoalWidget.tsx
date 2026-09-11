import clsx from 'clsx'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CircularProgress } from '@/components/CircularProgress'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { GoalDef, GoalDirection } from '@/types'
import { goalProgress, useGoals } from './use-goals'

export function GoalRing({ goal }: { goal: GoalDef & { id: string } }) {
  const [open, setOpen] = useState(false)
  const progress = goalProgress(goal)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-3 shadow-lg shadow-black/20"
      >
        <CircularProgress progress={progress} accent="violet">
          <span className="text-sm font-semibold text-neutral-50">{goal.currentValue}</span>
          <span className="text-[9px] text-neutral-500">
            /{goal.targetValue}
            {goal.unit ? ` ${goal.unit}` : ''}
          </span>
        </CircularProgress>
        <span className="max-w-[80px] truncate text-xs text-neutral-400">{goal.title}</span>
      </button>

      {open && <GoalDetailModal goal={goal} onClose={() => setOpen(false)} />}
    </>
  )
}

function GoalDetailModal({
  goal,
  onClose,
}: {
  goal: GoalDef & { id: string }
  onClose: () => void
}) {
  const { update, remove } = useGoals()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(goal.currentValue.toString())

  function saveValue(e: React.FormEvent) {
    e.preventDefault()
    if (value === '') return
    update(goal.id, { currentValue: Number(value), updatedAt: Date.now() })
    onClose()
  }

  if (editing) {
    return (
      <GoalModal
        existing={goal}
        onClose={onClose}
        onSave={(data) => {
          update(goal.id, { ...data, updatedAt: Date.now() })
          onClose()
        }}
      />
    )
  }

  return (
    <Modal title={goal.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-400">
          Started at {goal.startValue}
          {goal.unit ? ` ${goal.unit}` : ''}, target {goal.targetValue}
          {goal.unit ? ` ${goal.unit}` : ''}.
        </p>
        <form onSubmit={saveValue} className="space-y-2">
          <label className="block text-xs text-neutral-500">Current value</label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-violet-600 px-4 text-sm text-white hover:bg-violet-500"
            >
              Save
            </button>
          </div>
        </form>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
          >
            <Pencil size={12} /> Edit goal
          </button>
          <button
            onClick={() => {
              remove(goal.id)
              onClose()
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function GoalModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: GoalDef
  onClose: () => void
  onSave: (data: Omit<GoalDef, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [unit, setUnit] = useState(existing?.unit ?? '')
  const [startValue, setStartValue] = useState(existing?.startValue.toString() ?? '')
  const [targetValue, setTargetValue] = useState(existing?.targetValue.toString() ?? '')
  const [direction, setDirection] = useState<GoalDirection>(existing?.direction ?? 'decrease')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || startValue === '' || targetValue === '') return
    onSave({
      title: title.trim(),
      unit: unit.trim() || undefined,
      startValue: Number(startValue),
      targetValue: Number(targetValue),
      direction,
      currentValue: existing?.currentValue ?? Number(startValue),
    })
  }

  return (
    <Modal title={existing ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="Goal, e.g. Weight, Push-ups"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Unit (optional), e.g. lbs, reps"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Starting at</label>
            <input
              type="number"
              required
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Target</label>
            <input
              type="number"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
          <button
            type="button"
            onClick={() => setDirection('decrease')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition',
              direction === 'decrease' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
            )}
          >
            Going down (e.g. weight loss)
          </button>
          <button
            type="button"
            onClick={() => setDirection('increase')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition',
              direction === 'increase' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
            )}
          >
            Going up (e.g. push-ups)
          </button>
        </div>
        <button type="submit" className={primaryButtonClass}>
          {existing ? 'Save changes' : 'Create goal'}
        </button>
      </form>
    </Modal>
  )
}
