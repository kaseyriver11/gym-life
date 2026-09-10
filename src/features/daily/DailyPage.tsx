import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import { cancelTaskReminder, scheduleTaskReminder } from '@/lib/notifications'
import type { DailyTask } from '@/types'
import { sortDailyTasks, useDailyTasks } from './use-daily-tasks'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function DailyPage() {
  const [date, setDate] = useState(todayISO())
  const { items, add, update, remove } = useDailyTasks(date)
  const [showAdd, setShowAdd] = useState(false)
  const sorted = sortDailyTasks(items)

  async function toggleComplete(task: DailyTask) {
    await update(task.id, { completed: !task.completed, updatedAt: Date.now() })
  }

  async function handleDelete(task: DailyTask) {
    await remove(task.id)
    if (task.time) await cancelTaskReminder(task.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-50">
            {format(parseISO(date), 'EEEE, MMM d')}
          </p>
          {date !== todayISO() && (
            <button
              onClick={() => setDate(todayISO())}
              className="text-xs text-indigo-400 hover:underline"
            >
              Back to today
            </button>
          )}
        </div>
        <button
          onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          Nothing on the list for this day.
        </p>
      )}

      <ul className="space-y-2">
        {sorted.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
          >
            <button
              onClick={() => toggleComplete(task)}
              className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                task.completed
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-neutral-600'
              }`}
              aria-label="Toggle complete"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm ${
                  task.completed ? 'text-neutral-500 line-through' : 'text-neutral-100'
                }`}
              >
                {task.title}
              </p>
              {task.time && (
                <p className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock size={12} />
                  {task.time}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(task)}
              className="text-xs text-neutral-600 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowAdd(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
      >
        <Plus size={16} /> Add task
      </button>

      {showAdd && (
        <AddTaskModal
          date={date}
          onClose={() => setShowAdd(false)}
          onCreate={async (data) => {
            const ref = await add(data)
            if (data.time) {
              await scheduleTaskReminder({
                taskId: ref.id,
                title: data.title,
                date: data.date,
                time: data.time,
              })
            }
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function AddTaskModal({
  date,
  onClose,
  onCreate,
}: {
  date: string
  onClose: () => void
  onCreate: (data: Omit<DailyTask, 'id'>) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
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
      date,
      time: time || undefined,
      completed: false,
      reminderEnabled: Boolean(time),
      createdAt: now,
      updatedAt: now,
    })
    setSubmitting(false)
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            Time (optional — leave blank for anytime today)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          Add task
        </button>
      </form>
    </Modal>
  )
}
