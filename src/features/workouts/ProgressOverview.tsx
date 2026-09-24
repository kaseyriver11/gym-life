import clsx from 'clsx'
import { addDays, format, parseISO } from 'date-fns'
import { Flame } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { WorkoutSession } from '@/types'
import { Card, Stat, TrendLine } from './ProgressCharts'
import {
  activityByDate,
  weekStartISO,
  weekStreak,
  weeklyMuscleSets,
  WEEKLY_SET_RANGE,
  type ActivityType,
  type ExerciseInfo,
} from './progress-stats'
import { muscleGroupStyle } from './muscle-groups'
import { strengthIndexTrend } from './strength-score'

/** Categorical colors for the three kinds of training, validated for
 * contrast and color-blind separation against the dark card surface. The
 * legend + tap-for-detail keep identity from riding on color alone. */
const ACTIVITY_COLORS: Record<ActivityType, { hex: string; bg: string; label: string }> = {
  lift: { hex: '#6366f1', bg: 'bg-indigo-500', label: 'Lifting' },
  cardio: { hex: '#0d9488', bg: 'bg-teal-600', label: 'Cardio' },
  mobility: { hex: '#d97706', bg: 'bg-amber-600', label: 'Mobility' },
}
const ACTIVITY_ORDER: ActivityType[] = ['lift', 'cardio', 'mobility']
const CALENDAR_WEEKS = 26

function ConsistencyCalendar({
  days,
  workoutsPerWeek,
}: {
  days: Map<string, Set<ActivityType>>
  workoutsPerWeek: number
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const firstWeek = addDays(parseISO(weekStartISO(new Date())), -7 * (CALENDAR_WEEKS - 1))
  const weeks = Array.from({ length: CALENDAR_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => format(addDays(firstWeek, w * 7 + d), 'yyyy-MM-dd')),
  )

  const thisWeekDates = weeks[weeks.length - 1]
  const counts = ACTIVITY_ORDER.map((t) => ({
    type: t,
    n: thisWeekDates.filter((d) => days.get(d)?.has(t)).length,
  }))
  const trainingDaysThisWeek = thisWeekDates.filter((d) => days.has(d)).length
  const streak = weekStreak(days, workoutsPerWeek)
  const pickedTypes = picked ? days.get(picked) : undefined

  return (
    <Card
      title="Consistency — last 6 months"
      aside={
        streak > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-300">
            <Flame size={13} className="text-orange-400" />
            {streak} week{streak === 1 ? '' : 's'} at {workoutsPerWeek}+ days
          </span>
        )
      }
    >
      <div className="flex justify-between gap-[3px]">
        {weeks.map((week) => (
          <div key={week[0]} className="flex flex-1 flex-col gap-[3px]">
            {week.map((date) => {
              const types = days.get(date)
              const future = date > today
              return (
                <button
                  key={date}
                  disabled={future}
                  onClick={() => setPicked(picked === date ? null : date)}
                  aria-label={`${date}: ${types ? [...types].join(', ') : 'rest'}`}
                  className={clsx(
                    'flex aspect-square w-full overflow-hidden rounded-[3px]',
                    future ? 'bg-transparent' : 'bg-neutral-800',
                    picked === date && 'ring-2 ring-neutral-200',
                    date === today && picked !== date && 'ring-1 ring-neutral-500',
                  )}
                >
                  {/* One stripe per kind of training done that day, so a
                      lift + cardio day shows both rather than one hiding
                      the other. */}
                  {types &&
                    ACTIVITY_ORDER.filter((t) => types.has(t)).map((t) => (
                      <span key={t} className={clsx('h-full flex-1', ACTIVITY_COLORS[t].bg)} />
                    ))}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {ACTIVITY_ORDER.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span className={clsx('h-2.5 w-2.5 rounded-sm', ACTIVITY_COLORS[t].bg)} />
            {ACTIVITY_COLORS[t].label}
          </span>
        ))}
      </div>

      <p className="mt-2 border-t border-neutral-800 pt-2 text-xs text-neutral-400">
        {picked ? (
          <>
            <span className="text-neutral-200">{format(parseISO(picked), 'EEE, MMM d')}</span> —{' '}
            {pickedTypes
              ? ACTIVITY_ORDER.filter((t) => pickedTypes.has(t))
                  .map((t) => ACTIVITY_COLORS[t].label)
                  .join(' + ')
              : 'rest day'}
          </>
        ) : (
          <>
            This week: <span className="text-neutral-200">{trainingDaysThisWeek} training days</span>
            {counts.some((c) => c.n > 0) &&
              ` · ${counts
                .filter((c) => c.n > 0)
                .map((c) => `${c.n} ${ACTIVITY_COLORS[c.type].label.toLowerCase()}`)
                .join(' · ')}`}
          </>
        )}
      </p>
    </Card>
  )
}

/** Scale for the per-muscle bars — a bit past the top of the target range
 * so hitting 20 doesn't slam into the right edge. */
const SET_SCALE_MAX = 25

function MuscleSetsCard({
  sessions,
  exercisesById,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
}) {
  const { weekStarts, groups } = useMemo(
    () => weeklyMuscleSets(sessions, exercisesById, 4),
    [sessions, exercisesById],
  )
  const { low, high } = WEEKLY_SET_RANGE
  const pct = (n: number) => `${(Math.min(n, SET_SCALE_MAX) / SET_SCALE_MAX) * 100}%`

  return (
    <Card title="Weekly sets per muscle group">
      {groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">No strength sets logged in the last 4 weeks.</p>
      ) : (
        <>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] text-neutral-500">
            <span className="w-[4.5rem] shrink-0" />
            <span className="flex-1">This week</span>
            <span className="w-[5.5rem] shrink-0 text-right">
              {weekStarts
                .slice(0, -1)
                .map((w) => format(parseISO(w), 'M/d'))
                .join(' · ')}
            </span>
          </div>
          <div className="space-y-2">
            {groups.map(({ group, counts }) => {
              const current = counts[counts.length - 1]
              const style = muscleGroupStyle(group)
              return (
                <div key={group} className="flex items-center gap-2">
                  <span className="w-[4.5rem] shrink-0 truncate text-xs text-neutral-300">{group}</span>
                  <div className="relative h-3 flex-1 rounded-full bg-neutral-800">
                    {/* Shaded 10-20 target band behind the bar. */}
                    <div
                      className="absolute inset-y-0 border-x border-dashed border-neutral-500/60 bg-neutral-700/40"
                      style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
                    />
                    <div
                      className={clsx('absolute inset-y-0 left-0 rounded-full', style.dot)}
                      style={{ width: pct(current) }}
                    />
                    <span className="absolute -top-px right-1 text-[10px] font-semibold text-neutral-100">
                      {current}
                    </span>
                  </div>
                  <span className="w-[5.5rem] shrink-0 text-right text-[11px] tabular-nums text-neutral-500">
                    {counts.slice(0, -1).join(' · ')}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-neutral-600">
            Shaded band = {low}–{high} sets/week, a commonly cited productive range. Each exercise counts toward its
            main muscle group; a left/right pair is one set.
          </p>
        </>
      )}
    </Card>
  )
}

function StrengthTrendCard({
  sessions,
  exercisesById,
  snapshots,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
  snapshots: { date: string; weightLbs?: number }[]
}) {
  const { points: all, relative } = useMemo(
    () => strengthIndexTrend(sessions, exercisesById, snapshots),
    [sessions, exercisesById, snapshots],
  )
  // A point built from one or two lifts is mostly noise — wait until at
  // least three repeated lifts back it.
  const points = all.filter((p) => p.exercises >= 3)
  const last = points[points.length - 1]
  const monthAgoISO = format(addDays(new Date(), -28), 'yyyy-MM-dd')
  const monthAgo = [...points].reverse().find((p) => p.date <= monthAgoISO)
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n * 10) / 10}%`

  return (
    <Card title="Strength index">
      {points.length < 2 ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          Log the same lifts across a couple of sessions to see a trend.
        </p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Since you started" value={pct(last.index - 100)} />
            <Stat
              label="Last 4 weeks"
              value={monthAgo ? pct(((last.index - monthAgo.index) / monthAgo.index) * 100) : '—'}
            />
            <Stat label="Lifts counted" value={`${last.exercises}`} sub="logged 2+ times" />
          </div>
          <TrendLine
            data={points}
            dataKey="index"
            color="#2dd4bf"
            label="Index"
            formatValue={(v) => `${Math.round(v)}`}
          />
          <p className="mt-2 text-[11px] text-neutral-600">
            100 = where you started. Each lift you've logged at least twice is compared only with itself (best
            estimated 1RM per session{relative ? ', relative to your bodyweight at the time' : ''}), then averaged — so
            a long session or a different split doesn't move it, and one odd lift can't swing it; getting stronger
            does.
            {!relative && ' Log bodyweight on the Health tab to measure strength relative to bodyweight.'}
          </p>
        </>
      )}
    </Card>
  )
}

export function ProgressOverview({
  sessions,
  exercisesById,
  snapshots,
  workoutsPerWeek,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
  snapshots: { date: string; weightLbs?: number }[]
  workoutsPerWeek: number
}) {
  const days = useMemo(() => activityByDate(sessions, exercisesById), [sessions, exercisesById])
  return (
    <div className="space-y-4">
      <ConsistencyCalendar days={days} workoutsPerWeek={workoutsPerWeek} />
      <MuscleSetsCard sessions={sessions} exercisesById={exercisesById} />
      <StrengthTrendCard sessions={sessions} exercisesById={exercisesById} snapshots={snapshots} />
    </div>
  )
}
