import clsx from 'clsx'
import { format, parseISO, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { inputClass } from '@/components/form'
import type { WorkoutSession } from '@/types'
import { muscleGroupStyle } from './muscle-groups'
import { useExercises } from './use-exercises'
import { useWorkoutSessions } from './use-workout-sessions'

function WeeklyVolumeSection({
  sessions,
  exercises,
}: {
  sessions: WorkoutSession[]
  exercises: { id: string; muscleGroup?: string }[]
}) {
  const data = useMemo(() => {
    const groupByExercise = new Map(exercises.map((ex) => [ex.id, ex.muscleGroup]))
    const cutoff = format(subDays(new Date(), 6), 'yyyy-MM-dd')
    const counts = new Map<string, number>()
    for (const session of sessions) {
      if (session.date < cutoff) continue
      for (const entry of session.entries) {
        const group = groupByExercise.get(entry.exerciseId) ?? 'Other'
        const completedSets = entry.sets.filter((s) => s.completed).length
        if (completedSets === 0) continue
        counts.set(group, (counts.get(group) ?? 0) + completedSets)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [sessions, exercises])

  const max = Math.max(1, ...data.map(([, count]) => count))

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
      <p className="mb-3 text-xs font-medium text-neutral-400">Sets by muscle group — last 7 days</p>
      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">No sets logged this week yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map(([group, count]) => {
            const style = muscleGroupStyle(group)
            return (
              <div key={group} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-xs text-neutral-400">{group}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={clsx('h-full rounded-full', style.dot)}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-neutral-500">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ProgressTab() {
  const { items: exercises } = useExercises()
  const { items: sessions } = useWorkoutSessions()
  const [exerciseId, setExerciseId] = useState('')

  const data = useMemo(() => {
    if (!exerciseId) return []
    return sessions
      .map((session) => {
        const entry = session.entries.find((e) => e.exerciseId === exerciseId)
        if (!entry || entry.sets.length === 0) return null
        const topWeight = Math.max(...entry.sets.map((s) => s.weight))
        const volume = entry.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
        return { date: session.date, topWeight, volume }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [sessions, exerciseId])

  return (
    <div className="space-y-4">
      <WeeklyVolumeSection sessions={sessions} exercises={exercises} />

      <select
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        className={inputClass}
      >
        <option value="">Pick an exercise…</option>
        {[...exercises]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
      </select>

      {exerciseId && data.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          No logged sets for this exercise yet.
        </p>
      )}

      {data.length > 0 && (
        <div className="h-64 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-400">Top set weight (lbs)</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'M/d')}
                stroke="#737373"
                fontSize={11}
              />
              <YAxis stroke="#737373" fontSize={11} width={32} />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
                contentStyle={{
                  background: '#171717',
                  border: '1px solid #404040',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="topWeight"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
