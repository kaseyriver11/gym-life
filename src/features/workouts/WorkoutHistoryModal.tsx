import { format, parseISO } from 'date-fns'
import { Modal } from '@/components/Modal'
import type { WorkoutSession } from '@/types'

export function WorkoutHistoryModal({
  sessions,
  onSelect,
  onClose,
}: {
  sessions: WorkoutSession[]
  onSelect: (date: string) => void
  onClose: () => void
}) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

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
              <li key={session.id}>
                <button
                  onClick={() => onSelect(session.date)}
                  className="flex w-full flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-left hover:border-indigo-500"
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
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
