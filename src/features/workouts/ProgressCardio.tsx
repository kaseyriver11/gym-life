import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { inputClass } from '@/components/form'
import type { WorkoutSession } from '@/types'
import { Card, Chips, Stat, TrendLine, WeeklyBars } from './ProgressCharts'
import {
  cardioRecords,
  cardioSessions,
  cardioWeeks,
  formatSeconds,
  weekStartISO,
  type ExerciseInfo,
} from './progress-stats'

type WeekMetric = 'minutes' | 'miles'
type TrendMetric = 'minutes' | 'miles' | 'pace'

export function ProgressCardio({
  sessions,
  exercisesById,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
}) {
  const list = useMemo(() => cardioSessions(sessions, exercisesById), [sessions, exercisesById])
  const weeks = useMemo(() => cardioWeeks(list, 8), [list])
  const records = useMemo(() => cardioRecords(list), [list])
  const activities = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of list) counts.set(c.activity, (counts.get(c.activity) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a)
  }, [list])

  const [weekMetric, setWeekMetric] = useState<WeekMetric>('minutes')
  const [activityChoice, setActivity] = useState('')
  const activity = activities.includes(activityChoice) ? activityChoice : (activities[0] ?? '')
  const [trendChoice, setTrend] = useState<TrendMetric>('minutes')

  const activityPoints = useMemo(() => {
    // One point per day (two runs on one day are summed).
    const byDate = new Map<string, { date: string; minutes: number; miles: number; seconds: number }>()
    for (const c of list.filter((c) => c.activity === activity)) {
      const cur = byDate.get(c.date) ?? { date: c.date, minutes: 0, miles: 0, seconds: 0 }
      cur.seconds += c.seconds
      cur.miles += c.miles
      byDate.set(c.date, cur)
    }
    return [...byDate.values()].map((p) => ({
      date: p.date,
      minutes: Math.round(p.seconds / 60),
      miles: Math.round(p.miles * 100) / 100,
      pace: p.miles > 0 && p.seconds > 0 ? p.seconds / p.miles : undefined,
    }))
  }, [list, activity])

  const hasDistance = activityPoints.some((p) => p.miles > 0)
  const trendOptions: { key: TrendMetric; label: string }[] = [
    { key: 'minutes', label: 'Duration' },
    ...(hasDistance
      ? [
          { key: 'miles' as const, label: 'Distance' },
          { key: 'pace' as const, label: 'Pace' },
        ]
      : []),
  ]
  const trend = trendOptions.some((o) => o.key === trendChoice) ? trendChoice : 'minutes'
  const trendData = trend === 'pace' ? activityPoints.filter((p) => p.pace != null) : activityPoints

  if (list.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">Log some cardio and it'll add up here.</p>
  }

  const thisWeek = weeks[weeks.length - 1]
  const thisWeekSessions = list.filter((c) => weekStartISO(c.date) === thisWeek.weekStart).length
  const avgMinutes = Math.round(weeks.slice(0, -1).reduce((n, w) => n + w.minutes, 0) / (weeks.length - 1))
  const activityRecords = records.find((r) => r.activity === activity)?.records ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="This week" value={`${thisWeek.minutes} min`} sub={`${thisWeekSessions} session${thisWeekSessions === 1 ? '' : 's'}`} />
        <Stat label="Distance" value={`${thisWeek.miles} mi`} sub="this week" />
        <Stat label="7-wk avg" value={`${avgMinutes} min`} sub="per week" />
      </div>

      <Card
        title="Weekly cardio"
        aside={
          <Chips
            options={[
              { key: 'minutes', label: 'Minutes' },
              { key: 'miles', label: 'Miles' },
            ]}
            value={weekMetric}
            onChange={setWeekMetric}
          />
        }
      >
        <WeeklyBars
          data={weeks}
          dataKey={weekMetric}
          label={weekMetric === 'minutes' ? 'Cardio' : 'Distance'}
          unit={weekMetric === 'minutes' ? 'min' : 'mi'}
        />
      </Card>

      <Card>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className={`${inputClass} mb-3`}
        >
          {activities.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {activityRecords.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {activityRecords.map((r) => (
              <Stat key={r.label} label={r.label} value={r.value} sub={format(parseISO(r.date), 'MMM d')} />
            ))}
          </div>
        )}

        <div className="mb-3">
          <Chips options={trendOptions} value={trend} onChange={setTrend} />
        </div>
        {trendData.length < 2 ? (
          <p className="py-6 text-center text-sm text-neutral-500">Log this activity again to see a trend.</p>
        ) : (
          <TrendLine
            data={trendData}
            dataKey={trend}
            color="#2dd4bf"
            label={trendOptions.find((o) => o.key === trend)!.label}
            formatValue={(v) =>
              trend === 'pace' ? formatSeconds(v) : trend === 'miles' ? `${v}` : `${Math.round(v)}`
            }
          />
        )}
        {trend === 'pace' && (
          <p className="mt-2 text-[11px] text-neutral-600">Minutes per mile — lower is faster.</p>
        )}
      </Card>

      <Card title="Recent cardio">
        <ul className="divide-y divide-neutral-800">
          {[...list]
            .reverse()
            .slice(0, 10)
            .map((c, i) => (
              <li key={`${c.date}-${c.exerciseId}-${i}`} className="flex items-center gap-2 py-2 text-xs">
                <span className="w-14 shrink-0 text-neutral-500">{format(parseISO(c.date), 'MMM d')}</span>
                <span className="min-w-0 flex-1 truncate text-neutral-300">{c.activity}</span>
                <span className="shrink-0 tabular-nums text-neutral-400">
                  {formatSeconds(c.seconds)}
                  {c.miles > 0 && ` · ${c.miles} mi`}
                  {c.pace != null && ` · ${formatSeconds(c.pace)}/mi`}
                </span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  )
}
