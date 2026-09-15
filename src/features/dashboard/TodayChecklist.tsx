import clsx from 'clsx'
import { format } from 'date-fns'
import { ChevronRight, Clock, Dumbbell, HeartPulse, Minus, Pill, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { inputClass } from '@/components/form'
import { occurrencesForDate, sortTaskDefs, useTaskDefs, useTaskLogs } from '@/features/daily/use-daily-tasks'
import type { DailyTaskDef, HealthLinkType } from '@/types'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

const HEALTH_LINK_ICONS: Record<HealthLinkType, typeof Dumbbell> = {
  workout: Dumbbell,
  exercise: Dumbbell,
  cardio: HeartPulse,
  medicine: Pill,
}

/** Today's to-dos, front and center on the home page — not just a summary
 * with a link elsewhere, but the actual add/complete interactions, since
 * "add a to-do" and "check one off" are two of the handful of things
 * someone opens this app to do. Editing (time, repeat, quantity, delete)
 * stays on the full Today page — this is deliberately just the fast path. */
export function TodayChecklist() {
  const today = todayISO()
  const { items: defs, add } = useTaskDefs()
  const { items: logs, add: addLog, update: updateLog } = useTaskLogs(today)
  const [quickAdd, setQuickAdd] = useState('')

  const occurrences = sortTaskDefs(occurrencesForDate(defs, today))
  const logByTaskId = new Map(logs.map((log) => [log.taskId, log]))

  async function setValue(task: DailyTaskDef, value: number) {
    const log = logByTaskId.get(task.id)
    if (log) {
      await updateLog(log.id, { value, updatedAt: Date.now() })
    } else {
      await addLog({ taskId: task.id, date: today, value, updatedAt: Date.now() })
    }
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickAdd.trim()) return
    const now = Date.now()
    add({
      title: quickAdd.trim(),
      trackingType: 'checkbox',
      reminderEnabled: false,
      isOneTime: true,
      date: today,
      createdAt: now,
      updatedAt: now,
    })
    setQuickAdd('')
  }

  const doneCount = occurrences.filter((t) => {
    const value = logByTaskId.get(t.id)?.value ?? 0
    return t.trackingType === 'quantity' ? value >= (t.targetValue ?? 1) : value >= 1
  }).length

  return (
    <div className="space-y-2.5 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">Today</h2>
        <Link
          to="/today"
          className="flex items-center gap-0.5 text-xs text-neutral-500 hover:text-indigo-400"
        >
          {occurrences.length > 0 && `${doneCount}/${occurrences.length} · `}More
          <ChevronRight size={13} />
        </Link>
      </div>

      {occurrences.length === 0 ? (
        <p className="py-2 text-sm text-neutral-500">Nothing planned for today yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {occurrences.map((task) => {
            const value = logByTaskId.get(task.id)?.value ?? 0
            const isQuantity = task.trackingType === 'quantity'
            const target = task.targetValue ?? 1
            const done = isQuantity ? value >= target : value >= 1
            const Icon = task.healthLink ? HEALTH_LINK_ICONS[task.healthLink.type] : null

            return (
              <li key={task.id} className="flex items-center gap-2.5">
                {isQuantity ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setValue(task, Math.max(0, value - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      aria-label="Decrease"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center text-xs text-neutral-100">{value}</span>
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
                <span
                  className={clsx(
                    'flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm',
                    done ? 'text-neutral-500 line-through' : 'text-neutral-200',
                  )}
                >
                  {Icon && <Icon size={12} className="shrink-0 text-teal-400" />}
                  <span className="truncate">{task.title}</span>
                </span>
                {task.time && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-600">
                    <Clock size={10} /> {task.time}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleQuickAdd} className="flex gap-2 pt-1">
        <input
          placeholder="Add a to-do…"
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          className={`${inputClass} py-1.5 text-sm`}
        />
        <button
          type="submit"
          disabled={!quickAdd.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500 disabled:opacity-40"
          aria-label="Add"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  )
}
