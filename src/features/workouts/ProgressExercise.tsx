import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inputClass } from '@/components/form'
import type { WorkoutSession } from '@/types'
import { Card, Chips, Stat, TrendLine } from './ProgressCharts'
import {
  exerciseHistory,
  exerciseKind,
  formatSeconds,
  loggedExercises,
  repMaxes,
  type ExerciseInfo,
  type ExerciseKind,
  type ExerciseSessionPoint,
} from './progress-stats'

type Metric = 'e1rm' | 'topWeight' | 'volume' | 'bestReps' | 'totalReps' | 'bestHold' | 'totalSeconds'

const METRICS: Record<Exclude<ExerciseKind, 'cardio'>, { key: Metric; label: string }[]> = {
  weighted: [
    { key: 'e1rm', label: 'Est. 1RM' },
    { key: 'topWeight', label: 'Top set' },
    { key: 'volume', label: 'Volume' },
  ],
  bodyweight: [
    { key: 'bestReps', label: 'Best set' },
    { key: 'totalReps', label: 'Total reps' },
  ],
  timed: [
    { key: 'bestHold', label: 'Longest hold' },
    { key: 'totalSeconds', label: 'Total time' },
  ],
}

function formatMetric(metric: Metric, v: number): string {
  if (metric === 'bestHold' || metric === 'totalSeconds') return formatSeconds(v)
  if (metric === 'bestReps' || metric === 'totalReps') return `${v}`
  return `${Math.round(v).toLocaleString()}`
}

function metricUnit(metric: Metric): string {
  if (metric === 'bestReps' || metric === 'totalReps') return 'reps'
  if (metric === 'bestHold' || metric === 'totalSeconds') return ''
  return 'lb'
}

function setsLine(p: ExerciseSessionPoint, kind: ExerciseKind): string {
  return p.sets
    .map((s) => {
      const side = s.side ? s.side[0].toUpperCase() : ''
      if (kind === 'timed') return `${formatSeconds(s.durationSeconds ?? 0)}${side}`
      if (kind === 'bodyweight') return `${s.reps}${side}`
      return `${s.weight}×${s.reps}${side}`
    })
    .join(', ')
}

export function ProgressExercise({
  sessions,
  exercisesById,
  snapshots,
  exerciseId,
  onPick,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
  snapshots: { date: string; weightLbs?: number }[]
  exerciseId: string
  onPick: (id: string) => void
}) {
  // Only exercises you've actually logged, most recent first — cardio has
  // its own tab with distance/pace instead of sets.
  const options = useMemo(
    () => loggedExercises(sessions).filter((o) => exercisesById.get(o.exerciseId)?.muscleGroup !== 'Cardio'),
    [sessions, exercisesById],
  )
  const selectedId = exerciseId || options[0]?.exerciseId || ''
  const info = exercisesById.get(selectedId)
  const allPoints = useMemo(
    () => (selectedId ? exerciseHistory(sessions, selectedId, info, snapshots) : []),
    [sessions, selectedId, info, snapshots],
  )
  // One-arm and two-arm sessions of the same exercise aren't comparable
  // (per-arm weights are lighter) — when both exist, chart one at a time.
  const hasSided = allPoints.some((p) => p.sets.some((s) => s.side))
  const hasBilateral = allPoints.some((p) => !p.sets.some((s) => s.side))
  const [modeChoice, setModeChoice] = useState<'two' | 'one'>('two')
  const mode = hasSided && !hasBilateral ? 'one' : hasBilateral && !hasSided ? 'two' : modeChoice
  const points = useMemo(
    () => allPoints.filter((p) => p.sets.some((s) => s.side) === (mode === 'one')),
    [allPoints, mode],
  )
  const kind = exerciseKind(info, points.flatMap((p) => p.sets))
  const metricOptions = kind === 'cardio' ? METRICS.weighted : METRICS[kind]
  const [metricChoice, setMetricChoice] = useState<Metric>('e1rm')
  const metric = metricOptions.some((m) => m.key === metricChoice) ? metricChoice : metricOptions[0].key

  // Sessions that set a new best on the headline metric, for the PR badges.
  const headline = metricOptions[0].key
  const prDates = useMemo(() => {
    const dates = new Set<string>()
    let best = 0
    for (const p of points) {
      if (p[headline] > best) {
        if (best > 0) dates.add(p.date)
        best = p[headline]
      }
    }
    return dates
  }, [points, headline])

  if (options.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-neutral-500">
        Log a few sets and each exercise's progress will show up here.
      </p>
    )
  }

  const first = points[0]
  const last = points[points.length - 1]
  const best = points.reduce((m, p) => Math.max(m, p[headline]), 0)
  const change = first && last && first[headline] > 0 && points.length > 1
    ? Math.round(((last[headline] - first[headline]) / first[headline]) * 100)
    : null
  const unit = metricUnit(headline)
  const maxes = kind === 'weighted' ? repMaxes(points) : []

  return (
    <div className="space-y-4">
      <select value={selectedId} onChange={(e) => onPick(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.exerciseId} value={o.exerciseId}>
            {o.name} — last {format(parseISO(o.lastDate), 'MMM d')}
          </option>
        ))}
      </select>

      {points.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Stat
            label={{ e1rm: 'Best est. 1RM', bestReps: 'Best set', bestHold: 'Longest hold' }[headline as 'e1rm'] ?? 'Best'}
            value={`${formatMetric(headline, best)}${unit ? ` ${unit}` : ''}`}
          />
          <Stat
            label="Since first"
            value={change == null ? '—' : `${change >= 0 ? '+' : ''}${change}%`}
            sub={first && format(parseISO(first.date), 'MMM d, yyyy')}
          />
          <Stat label="Sessions" value={`${points.length}`} sub={`${prDates.size} PR${prDates.size === 1 ? '' : 's'}`} />
        </div>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Chips options={metricOptions} value={metric} onChange={setMetricChoice} />
          {hasSided && hasBilateral && (
            <Chips
              options={[
                { key: 'two', label: 'Two-arm' },
                { key: 'one', label: 'One-arm' },
              ]}
              value={mode}
              onChange={setModeChoice}
            />
          )}
        </div>
        {points.length < 2 ? (
          <p className="py-6 text-center text-sm text-neutral-500">One session so far — log it again to see a trend.</p>
        ) : (
          <TrendLine
            data={points}
            dataKey={metric}
            label={metricOptions.find((m) => m.key === metric)!.label}
            formatValue={(v) => formatMetric(metric, v)}
          />
        )}
        {metric === 'e1rm' && (
          <p className="mt-2 text-[11px] text-neutral-600">
            Estimated one-rep max (Epley) from your best set each session — compares heavy triples and lighter
            sets of ten on one scale.
          </p>
        )}
      </Card>

      {maxes.length > 0 && (
        <Card title="Rep maxes — heaviest weight for each rep count">
          <div className="grid grid-cols-4 gap-1.5">
            {maxes.map((m) => (
              <div key={m.reps} className="rounded-lg bg-neutral-950/60 px-2 py-1.5 text-center">
                <p className="text-[10px] text-neutral-500">{m.reps} rep{m.reps === 1 ? '' : 's'}</p>
                <p className="text-sm font-semibold text-neutral-100">{m.weight}</p>
                <p className="text-[10px] text-neutral-600">{format(parseISO(m.date), 'M/d/yy')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="History">
        <ul className="divide-y divide-neutral-800">
          {[...points].reverse().map((p) => (
            <li key={p.date} className="flex items-start gap-2 py-2 text-xs">
              <span className="w-14 shrink-0 text-neutral-500">{format(parseISO(p.date), 'MMM d')}</span>
              <span className="min-w-0 flex-1 text-neutral-300">{setsLine(p, kind)}</span>
              <span className="flex shrink-0 items-center gap-1 text-neutral-500">
                {prDates.has(p.date) && <Trophy size={12} className="text-amber-400" aria-label="PR" />}
                <span className={clsx(prDates.has(p.date) && 'text-amber-300')}>
                  {formatMetric(headline, p[headline])}
                  {unit && ` ${unit}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
