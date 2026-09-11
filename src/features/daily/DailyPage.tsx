import clsx from 'clsx'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Minus, Pencil, Plus, Repeat } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import {
  cancelRecurringReminder,
  cancelTaskReminder,
  scheduleRecurringReminder,
  scheduleTaskReminder,
} from '@/lib/notifications'
import type { DailyTaskDef, TaskTrackingType } from '@/types'
import { occurrencesForDate, sortTaskDefs, useTaskDefs, useTaskLogs } from './use-daily-tasks'
import { WEEKDAY_LABELS } from './weekdays'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

type TaskDraft = {
  title: string
  notes?: string
  time?: string
  trackingType: TaskTrackingType
  unit?: string
  targetValue?: number
  isOneTime: boolean
  date?: string
  repeatDays?: number[]
}

async function applyReminder(taskId: string, draft: TaskDraft) {
  if (draft.isOneTime) {
    await cancelRecurringReminder(taskId)
    if (draft.time && draft.date) {
      await scheduleTaskReminder({ taskId, title: draft.title, date: draft.date, time: draft.time })
    } else {
      await cancelTaskReminder(taskId)
    }
  } else {
    await cancelTaskReminder(taskId)
    if (draft.time && draft.repeatDays?.length) {
      await scheduleRecurringReminder({
        taskId,
        title: draft.title,
        repeatDays: draft.repeatDays,
        time: draft.time,
      })
    } else {
      await cancelRecurringReminder(taskId)
    }
  }
}

export function DailyPage() {
  const [date, setDate] = useState(todayISO())
  const { items: defs, add, update, remove } = useTaskDefs()
  const { items: logs, add: addLog, update: updateLog } = useTaskLogs(date)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<DailyTaskDef | null>(null)
  const [quickAdd, setQuickAdd] = useState('')

  const occurrences = sortTaskDefs(occurrencesForDate(defs, date))
  const logByTaskId = new Map(logs.map((log) => [log.taskId, log]))

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickAdd.trim()) return
    const now = Date.now()
    add({
      title: quickAdd.trim(),
      trackingType: 'checkbox',
      reminderEnabled: false,
      isOneTime: true,
      date,
      createdAt: now,
      updatedAt: now,
    })
    setQuickAdd('')
  }

  async function setValue(task: DailyTaskDef, value: number) {
    const log = logByTaskId.get(task.id)
    if (log) {
      await updateLog(log.id, { value, updatedAt: Date.now() })
    } else {
      await addLog({ taskId: task.id, date, value, updatedAt: Date.now() })
    }
  }

  async function handleDelete(task: DailyTaskDef) {
    await remove(task.id)
    await cancelTaskReminder(task.id)
    await cancelRecurringReminder(task.id)
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

      {occurrences.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          Nothing on the list for this day.
        </p>
      )}

      <ul className="space-y-2">
        {occurrences.map((task) => {
          const value = logByTaskId.get(task.id)?.value ?? 0
          const isQuantity = task.trackingType === 'quantity'
          const target = task.targetValue ?? 1
          const done = isQuantity ? value >= target : value >= 1

          return (
            <li
              key={task.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-3"
            >
              <div className="flex items-center gap-3">
                {isQuantity ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setValue(task, Math.max(0, value - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      aria-label="Decrease"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm text-neutral-100">{value}</span>
                    <button
                      onClick={() => setValue(task, value + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      aria-label="Increase"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setValue(task, done ? 0 : 1)}
                    className={clsx(
                      'h-5 w-5 shrink-0 rounded-full border-2',
                      done ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
                    )}
                    aria-label="Toggle complete"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={clsx(
                      'truncate text-sm',
                      done ? 'text-neutral-500 line-through' : 'text-neutral-100',
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {task.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {task.time}
                      </span>
                    )}
                    {!task.isOneTime && (
                      <span className="flex items-center gap-1">
                        <Repeat size={11} />
                        {(task.repeatDays ?? []).map((d) => WEEKDAY_LABELS[d]).join(' ')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setEditing(task)}
                  className="text-neutral-500 hover:text-indigo-400"
                  aria-label="Edit task"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="text-xs text-neutral-600 hover:text-red-400"
                >
                  Remove
                </button>
              </div>

              {isQuantity && (
                <div className="mt-2 flex items-center gap-2 pl-[74px]">
                  <div className="h-1.5 flex-1 rounded-full bg-neutral-800">
                    <div
                      className={clsx(
                        'h-1.5 rounded-full transition-all',
                        done ? 'bg-emerald-500' : 'bg-indigo-500',
                      )}
                      style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {value}/{target} {task.unit}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          placeholder="Add a task…"
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!quickAdd.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500 disabled:opacity-40"
          aria-label="Add"
        >
          <Plus size={18} />
        </button>
      </form>
      <button
        onClick={() => setShowAdd(true)}
        className="w-full text-center text-xs text-neutral-500 hover:text-indigo-400"
      >
        Add with time, repeat, or quantity
      </button>

      {showAdd && (
        <TaskModal
          title="New task"
          initialDate={date}
          onClose={() => setShowAdd(false)}
          onSubmit={async (draft) => {
            const now = Date.now()
            const ref = await add({
              title: draft.title,
              notes: draft.notes,
              time: draft.time,
              trackingType: draft.trackingType,
              unit: draft.unit,
              targetValue: draft.targetValue,
              reminderEnabled: Boolean(draft.time),
              isOneTime: draft.isOneTime,
              date: draft.date,
              repeatDays: draft.repeatDays,
              createdAt: now,
              updatedAt: now,
            })
            await applyReminder(ref.id, draft)
            setShowAdd(false)
          }}
        />
      )}

      {editing && (
        <TaskModal
          title="Edit task"
          initialDate={date}
          existing={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (draft) => {
            await update(editing.id, {
              title: draft.title,
              notes: draft.notes,
              time: draft.time,
              trackingType: draft.trackingType,
              unit: draft.unit,
              targetValue: draft.targetValue,
              reminderEnabled: Boolean(draft.time),
              isOneTime: draft.isOneTime,
              date: draft.date,
              repeatDays: draft.repeatDays,
              updatedAt: Date.now(),
            })
            await applyReminder(editing.id, draft)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TaskModal({
  title,
  initialDate,
  existing,
  onClose,
  onSubmit,
}: {
  title: string
  initialDate: string
  existing?: DailyTaskDef
  onClose: () => void
  onSubmit: (draft: TaskDraft) => Promise<void>
}) {
  const [taskTitle, setTaskTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [time, setTime] = useState(existing?.time ?? '')
  const [isOneTime, setIsOneTime] = useState(existing?.isOneTime ?? true)
  const [oneTimeDate, setOneTimeDate] = useState(existing?.date ?? initialDate)
  const [repeatDays, setRepeatDays] = useState<number[]>(existing?.repeatDays ?? [])
  const [trackingType, setTrackingType] = useState<TaskTrackingType>(
    existing?.trackingType ?? 'checkbox',
  )
  const [unit, setUnit] = useState(existing?.unit ?? '')
  const [targetValue, setTargetValue] = useState(existing?.targetValue?.toString() ?? '')
  const [submitting, setSubmitting] = useState(false)

  function toggleDay(day: number) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return
    if (!isOneTime && repeatDays.length === 0) return
    if (trackingType === 'quantity' && (!unit.trim() || !targetValue)) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: taskTitle.trim(),
        notes: notes.trim() || undefined,
        time: time || undefined,
        trackingType,
        unit: trackingType === 'quantity' ? unit.trim() : undefined,
        targetValue: trackingType === 'quantity' ? Number(targetValue) : undefined,
        isOneTime,
        date: isOneTime ? oneTimeDate : undefined,
        repeatDays: isOneTime ? undefined : repeatDays,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          required
          placeholder="What needs doing?"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className={inputClass}
        />

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Schedule</p>
          <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
            <button
              type="button"
              onClick={() => setIsOneTime(true)}
              className={clsx(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition',
                isOneTime ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
              )}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setIsOneTime(false)}
              className={clsx(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition',
                !isOneTime ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
              )}
            >
              Repeats weekly
            </button>
          </div>
        </div>

        {isOneTime ? (
          <input
            type="date"
            value={oneTimeDate}
            onChange={(e) => setOneTimeDate(e.target.value)}
            className={inputClass}
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(day)}
                className={clsx(
                  'h-8 w-10 rounded-lg text-xs font-medium transition',
                  repeatDays.includes(day)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            Time (optional — leave blank for anytime)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Tracking</p>
          <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
            <button
              type="button"
              onClick={() => setTrackingType('checkbox')}
              className={clsx(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition',
                trackingType === 'checkbox' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
              )}
            >
              Simple checkbox
            </button>
            <button
              type="button"
              onClick={() => setTrackingType('quantity')}
              className={clsx(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition',
                trackingType === 'quantity' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
              )}
            >
              Track a quantity
            </button>
          </div>
        </div>

        {trackingType === 'quantity' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Unit, e.g. glasses"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              min={1}
              placeholder="Target, e.g. 8"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={
            submitting ||
            !taskTitle.trim() ||
            (!isOneTime && repeatDays.length === 0) ||
            (trackingType === 'quantity' && (!unit.trim() || !targetValue))
          }
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          {existing ? 'Save changes' : 'Add task'}
        </button>
      </form>
    </Modal>
  )
}
