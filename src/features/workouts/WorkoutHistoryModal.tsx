import { format, parseISO } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Modal } from '@/components/Modal'
import type { WorkoutSession } from '@/types'

export function WorkoutHistoryModal({
  sessions,
  onSelect,
  onDelete,
  onClose,
}: {
  sessions: WorkoutSession[]
  onSelect: (date: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function requestDelete(id: string) {
    if (confirmId === id) {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      setConfirmId(null)
      onDelete(id)
      return
    }
    setConfirmId(id)
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    confirmTimeout.current = setTimeout(() => setConfirmId(null), 2500)
  }

  return (
    <Modal title="Workout history" onClose={onClose}>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">No past workouts logged yet.</p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {sorted.map((session) => {
            const totalSets = session.entries.reduce(
              (sum, e) => sum + e.sets.filter((s) => s.completed).length,
              0,
            )
            return (
              <li key={session.id} className="flex items-stretch gap-1.5">
                <button
                  onClick={() => onSelect(session.date)}
                  className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-left hover:border-indigo-500"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-100">
                      {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {totalSets} set{totalSets === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    {session.entries.map((e) => e.exerciseName).join(', ') || 'No exercises'}
                  </p>
                </button>
                <button
                  onClick={() => requestDelete(session.id)}
                  className={
                    confirmId === session.id
                      ? 'shrink-0 rounded-lg bg-red-500/20 px-2 text-[11px] font-semibold text-red-400'
                      : 'flex w-9 shrink-0 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-900 hover:text-red-400'
                  }
                  aria-label="Delete this workout"
                  title="Delete this workout"
                >
                  {confirmId === session.id ? 'Confirm?' : <Trash2 size={15} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
