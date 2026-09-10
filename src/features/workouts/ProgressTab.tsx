import { format, parseISO } from 'date-fns'
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
import { useExercises } from './use-exercises'
import { useWorkoutSessions } from './use-workout-sessions'

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
