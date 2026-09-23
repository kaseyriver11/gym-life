import clsx from 'clsx'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ChevronRight, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { WorkoutSession } from '@/types'
import { Chips } from './ProgressCharts'
import { formatSeconds, personalRecords, type ExerciseInfo } from './progress-stats'
import { muscleGroupStyle } from './muscle-groups'

export function ProgressRecords({
  sessions,
  exercisesById,
  snapshots,
  onOpenExercise,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
  snapshots: { date: string; weightLbs?: number }[]
  onOpenExercise: (id: string) => void
}) {
  const records = useMemo(
    () => personalRecords(sessions, exercisesById, snapshots),
    [sessions, exercisesById, snapshots],
  )
  const groups = useMemo(
    () => [...new Set(records.map((r) => r.muscleGroup ?? 'Other'))].sort(),
    [records],
  )
  const [group, setGroup] = useState('all')
  const shown = group === 'all' ? records : records.filter((r) => (r.muscleGroup ?? 'Other') === group)
  const today = new Date()

  if (records.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">Your personal records will collect here.</p>
  }

  return (
    <div className="space-y-3">
      <Chips
        options={[{ key: 'all', label: 'All' }, ...groups.map((g) => ({ key: g, label: g }))]}
        value={group}
        onChange={setGroup}
      />
      <ul className="space-y-1.5">
        {shown.map((r) => {
          const recent = differenceInCalendarDays(today, parseISO(r.date)) <= 14
          return (
            <li key={r.exerciseId}>
              <button
                onClick={() => onOpenExercise(r.exerciseId)}
                className="flex w-full items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-left hover:border-neutral-700"
              >
                <span className={clsx('h-8 w-1 shrink-0 rounded-full', muscleGroupStyle(r.muscleGroup).dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-100">{r.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {r.detail} · {format(parseISO(r.date), 'MMM d, yyyy')}
                    {r.timesImproved > 0 && ` · beaten ${r.timesImproved}×`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-semibold text-neutral-100">
                    {recent && <Trophy size={12} className="text-amber-400" aria-label="Set in the last 2 weeks" />}
                    {r.kind === 'timed' ? formatSeconds(r.best) : r.kind === 'bodyweight' ? `${r.best}` : r.best}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {r.kind === 'timed' ? 'hold' : r.kind === 'bodyweight' ? 'reps' : 'e1RM lb'}
                  </p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-neutral-600" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] text-neutral-600">
        Newest records first. Loaded lifts rank by estimated 1RM, bodyweight moves by reps, holds by time. Trophy =
        set in the last two weeks.
      </p>
    </div>
  )
}
