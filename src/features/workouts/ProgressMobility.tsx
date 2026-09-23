import clsx from 'clsx'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { WorkoutSession } from '@/types'
import { FLEX_TESTS, flexTestHistory, mobilityWeeks, useFlexChecks, type FlexTest } from './flex-tests'
import { Card, Stat, TrendLine, WeeklyBars } from './ProgressCharts'
import { weekStartISO, type ExerciseInfo } from './progress-stats'

const MOBILITY_HEX = '#d97706'

function formatValue(test: FlexTest, v: number) {
  return `${v > 0 && test.unit === 'in' && test.key === 'toeTouch' ? '+' : ''}${v}${test.unit === 'in' ? '"' : 's'}`
}

export function ProgressMobility({
  sessions,
  exercisesById,
}: {
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
}) {
  const { weeks, blocks } = useMemo(() => mobilityWeeks(sessions, exercisesById, 8), [sessions, exercisesById])
  const { items: checks, add } = useFlexChecks()
  const [openTest, setOpenTest] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)

  const thisWeek = weeks[weeks.length - 1]
  const daysThisWeek = new Set(blocks.filter((b) => weekStartISO(b.date) === thisWeek.weekStart).map((b) => b.date)).size
  const avg = Math.round(weeks.slice(0, -1).reduce((n, w) => n + w.minutes, 0) / (weeks.length - 1))
  const lastCheck = [...checks].sort((a, b) => b.date.localeCompare(a.date))[0]
  const daysSinceCheck = lastCheck ? differenceInCalendarDays(new Date(), parseISO(lastCheck.date)) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="This week" value={`${thisWeek.minutes} min`} sub={`${daysThisWeek} day${daysThisWeek === 1 ? '' : 's'}`} />
        <Stat label="7-wk avg" value={`${avg} min`} sub="per week" />
        <Stat
          label="Last check-in"
          value={lastCheck ? format(parseISO(lastCheck.date), 'MMM d') : '—'}
          sub={daysSinceCheck != null ? `${daysSinceCheck}d ago` : 'none yet'}
        />
      </div>

      <Card title="Stretching & mobility minutes">
        {blocks.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Log stretches, mobility drills or yoga — or start a routine from the Plan tab.
          </p>
        ) : (
          <WeeklyBars data={weeks} dataKey="minutes" color={MOBILITY_HEX} label="Mobility" unit="min" />
        )}
      </Card>

      <Card
        title="Flexibility benchmarks"
        aside={
          <button
            onClick={() => setCheckingIn(true)}
            className="flex items-center gap-1 rounded-full bg-amber-600/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-600/30"
          >
            <Plus size={12} /> Check in
          </button>
        }
      >
        {daysSinceCheck != null && daysSinceCheck >= 28 && (
          <p className="mb-2 text-xs text-amber-300">It's been {Math.floor(daysSinceCheck / 7)} weeks — worth re-testing.</p>
        )}
        {checks.length === 0 && (
          <p className="mb-2 text-xs text-neutral-500">
            Six quick at-home tests. Do them now for a baseline, then every month or so to see whether your mobility
            work is paying off.
          </p>
        )}
        <ul className="divide-y divide-neutral-800">
          {FLEX_TESTS.map((test) => {
            const history = flexTestHistory(checks, test.key)
            const first = history[0]
            const last = history[history.length - 1]
            const delta = first && last && history.length > 1 ? Math.round((last.value - first.value) * 10) / 10 : null
            const improved = delta != null && (test.higherIsBetter ? delta > 0 : delta < 0)
            const isOpen = openTest === test.key
            return (
              <li key={test.key}>
                <button
                  onClick={() => setOpenTest(isOpen ? null : test.key)}
                  className="flex w-full items-center gap-2 py-2 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{test.label}</span>
                  {delta != null && delta !== 0 && (
                    <span className={clsx('text-[11px]', improved ? 'text-teal-400' : 'text-neutral-500')}>
                      {improved ? '▲' : '▼'} {Math.abs(delta)}
                      {test.unit === 'in' ? '"' : 's'} {improved ? 'better' : 'worse'}
                    </span>
                  )}
                  <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-neutral-100">
                    {last ? formatValue(test, last.value) : '—'}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-3">
                    <p className="mb-2 text-[11px] text-neutral-500">{test.how}</p>
                    {history.length >= 2 ? (
                      <TrendLine
                        data={history}
                        dataKey="value"
                        color={MOBILITY_HEX}
                        label={test.label}
                        formatValue={(v) => formatValue(test, v)}
                        height={140}
                      />
                    ) : (
                      <p className="text-xs text-neutral-600">
                        {history.length === 1 ? 'One result so far — re-test to see a trend.' : 'Not tested yet.'}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {checkingIn && (
        <CheckInModal
          onClose={() => setCheckingIn(false)}
          onSave={(results) => {
            add({ date: format(new Date(), 'yyyy-MM-dd'), results, createdAt: Date.now() })
            setCheckingIn(false)
          }}
        />
      )}
    </div>
  )
}

function CheckInModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (results: Record<string, number>) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const results = Object.fromEntries(
    Object.entries(values)
      .filter(([, v]) => v.trim() !== '' && !Number.isNaN(Number(v)))
      .map(([k, v]) => [k, Number(v)]),
  )

  return (
    <Modal title="Flexibility check-in" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-neutral-500">Fill in whichever tests you did — skip the rest. Warm up a little first.</p>
        {FLEX_TESTS.map((test) => (
          <label key={test.key} className="block">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm text-neutral-200">{test.label}</span>
              <span className="relative w-24 shrink-0">
                <input
                  type="number"
                  inputMode="decimal"
                  step={test.unit === 'in' ? 0.5 : 1}
                  value={values[test.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [test.key]: e.target.value }))}
                  className={`${inputClass} py-1.5 pr-8 text-right`}
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">
                  {test.unit === 'in' ? 'in' : 'sec'}
                </span>
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] text-neutral-500">{test.how}</span>
          </label>
        ))}
        <button
          onClick={() => onSave(results)}
          disabled={Object.keys(results).length === 0}
          className={primaryButtonClass}
        >
          Save check-in
        </button>
      </div>
    </Modal>
  )
}
