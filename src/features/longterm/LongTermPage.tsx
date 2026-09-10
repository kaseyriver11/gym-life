import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { LongTermCategory, LongTermTask, Priority } from '@/types'
import {
  CATEGORY_LABELS,
  PRIORITY_ORDER,
  useLongTermTasks,
} from './use-long-term-tasks'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as LongTermCategory[]

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-neutral-600',
}

export function LongTermPage() {
  const { items, add, update, remove } = useLongTermTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [hideDone, setHideDone] = useState(true)

  const visible = hideDone ? items.filter((t) => !t.completed) : items

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-300">The list</h2>
        <button
          onClick={() => setHideDone(!hideDone)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          {hideDone ? 'Show completed' : 'Hide completed'}
        </button>
      </div>

      {CATEGORIES.map((category) => {
        const tasks = visible
          .filter((t) => t.category === category)
          .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        if (tasks.length === 0) return null
        return (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {CATEGORY_LABELS[category]}
            </h3>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
                >
                  <button
                    onClick={() =>
                      update(task.id, { completed: !task.completed, updatedAt: Date.now() })
                    }
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      task.completed
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-neutral-600'
                    }`}
                    aria-label="Toggle complete"
                  />
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                    title={`${task.priority} priority`}
                  />
                  <p
                    className={`min-w-0 flex-1 truncate text-sm ${
                      task.completed
                        ? 'text-neutral-500 line-through'
                        : 'text-neutral-100'
                    }`}
                  >
                    {task.title}
                  </p>
                  <button
                    onClick={() => remove(task.id)}
                    className="text-xs text-neutral-600 hover:text-red-400"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          Nothing here. Add the first thing that's been nagging you.
        </p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
      >
        <Plus size={16} /> Add to the list
      </button>

      {showAdd && (
        <AddLongTermModal
          onClose={() => setShowAdd(false)}
          onCreate={async (data) => {
            await add(data)
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function AddLongTermModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: Omit<LongTermTask, 'id'>) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<LongTermCategory>('home')
  const [priority, setPriority] = useState<Priority>('medium')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    const now = Date.now()
    await onCreate({
      title: title.trim(),
      notes: notes.trim() || undefined,
      category,
      priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    })
    setSubmitting(false)
  }

  return (
    <Modal title="Add to the list" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="e.g. Fix the fence gate"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LongTermCategory)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputClass}
          >
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          Add
        </button>
      </form>
    </Modal>
  )
}
