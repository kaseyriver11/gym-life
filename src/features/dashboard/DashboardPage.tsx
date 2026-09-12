import clsx from 'clsx'
import { addDays, format } from 'date-fns'
import { CalendarCheck, Droplet, Footprints, Plus, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircularProgress } from '@/components/CircularProgress'
import { inputClass } from '@/components/form'
import { WidgetCard } from '@/components/WidgetCard'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  occurrencesForDate,
  sortTaskDefs,
  useTaskDefs,
  useTaskLogs,
} from '@/features/daily/use-daily-tasks'
import { useHealthSnapshots } from '@/features/health/use-health'
import { useWorkoutSessions } from '@/features/workouts/use-workout-sessions'
import { GoalModal, GoalRing } from './GoalWidget'
import { useDashboardPrefs } from './use-dashboard-prefs'
import { useGoals } from './use-goals'

const WIDGETS = [
  { key: 'today', label: 'Today' },
  { key: 'steps', label: 'Steps' },
  { key: 'water', label: 'Water' },
  { key: 'workoutsWeek', label: 'Workouts this week' },
] as const

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { hidden, targets, toggle, setTargets } = useDashboardPrefs()
  const { items: goals, add: addGoal } = useGoals()
  const [customizing, setCustomizing] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)

  const show = (key: string) => !hidden.includes(key)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <GreetingHeader />
        <button
          onClick={() => setCustomizing(!customizing)}
          className={clsx(
            'rounded-full p-2 hover:bg-neutral-900',
            customizing ? 'text-indigo-400' : 'text-neutral-500',
          )}
          aria-label="Customize dashboard"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {customizing && (
        <div className="space-y-2 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-4">
          <p className="text-xs font-medium text-neutral-400">Show on dashboard</p>
          {WIDGETS.map((w) => (
            <label key={w.key} className="flex items-center justify-between py-1 text-sm text-neutral-300">
              {w.label}
              <input
                type="checkbox"
                checked={show(w.key)}
                onChange={() => toggle(w.key)}
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
          ))}
          {goals.map((g) => (
            <label
              key={g.id}
              className="flex items-center justify-between py-1 text-sm text-neutral-300"
            >
              {g.title} (goal)
              <input
                type="checkbox"
                checked={show(`goal:${g.id}`)}
                onChange={() => toggle(`goal:${g.id}`)}
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
          ))}
          <button
            onClick={() => setAddingGoal(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700 py-2 text-xs text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
          >
            <Plus size={14} /> New goal
          </button>

          <p className="pt-2 text-xs font-medium text-neutral-400">Daily/weekly targets</p>
          <TargetRow label="Steps" value={targets.steps} onSave={(v) => setTargets({ steps: v })} />
          <TargetRow
            label="Water (oz)"
            value={targets.water}
            onSave={(v) => setTargets({ water: v })}
          />
          <TargetRow
            label="Workouts / week"
            value={targets.workoutsPerWeek}
            onSave={(v) => setTargets({ workoutsPerWeek: v })}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {show('steps') && <StepsRing target={targets.steps} />}
        {show('water') && <WaterRing target={targets.water} />}
        {show('workoutsWeek') && <WorkoutsRing target={targets.workoutsPerWeek} />}
        {goals
          .filter((g) => show(`goal:${g.id}`))
          .map((g) => (
            <GoalRing key={g.id} goal={g} />
          ))}
      </div>

      <div className="space-y-3">{show('today') && <TodayWidget />}</div>

      {addingGoal && (
        <GoalModal
          onClose={() => setAddingGoal(false)}
          onSave={(data) => {
            const now = Date.now()
            addGoal({ ...data, createdAt: now, updatedAt: now })
            setAddingGoal(false)
          }}
        />
      )}
    </div>
  )
}

function GreetingHeader() {
  const { user } = useAuth()
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div>
      <h1 className="bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-xl font-semibold text-transparent">
        {greeting()}, {name}
      </h1>
      <p className="text-sm text-neutral-500">{format(new Date(), 'EEEE, MMMM d')}</p>
    </div>
  )
}

function TargetRow({
  label,
  value,
  onSave,
}: {
  label: string
  value: number
  onSave: (value: number) => void
}) {
  const [draft, setDraft] = useState(value.toString())

  function commit() {
    const n = Number(draft)
    if (n > 0) onSave(n)
    else setDraft(value.toString())
  }

  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm text-neutral-300">
      {label}
      <input
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className={`${inputClass} w-20 py-1 text-right`}
      />
    </label>
  )
}

function RingTile({
  label,
  progress,
  accent,
  children,
  to,
}: {
  label: string
  progress: number
  accent: 'cyan' | 'sky' | 'emerald'
  children: React.ReactNode
  to?: string
}) {
  const inner = (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-3 shadow-lg shadow-black/20">
      <CircularProgress progress={progress} accent={accent}>
        {children}
      </CircularProgress>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  )
  if (!to) return inner
  return (
    <Link to={to} className="block">
      {inner}
    </Link>
  )
}

function StepsRing({ target }: { target: number }) {
  const { items } = useHealthSnapshots()
  const steps = items.find((s) => s.date === todayISO())?.steps ?? 0
  return (
    <RingTile label="Steps" progress={(steps / target) * 100} accent="cyan" to="/health">
      <Footprints size={14} className="mb-0.5 text-cyan-400" />
      <span className="text-xs font-semibold text-neutral-50">{steps.toLocaleString()}</span>
    </RingTile>
  )
}

function WaterRing({ target }: { target: number }) {
  const { items, add, update } = useHealthSnapshots()
  const snapshot = items.find((s) => s.date === todayISO())
  const waterOz = snapshot?.waterOz ?? 0

  async function addWater(e: React.MouseEvent, oz: number) {
    e.preventDefault()
    e.stopPropagation()
    if (snapshot) {
      await update(snapshot.id, { waterOz: waterOz + oz })
    } else {
      await add({ date: todayISO(), waterOz: oz, source: 'manual' })
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-3 shadow-lg shadow-black/20">
      <button onClick={(e) => addWater(e, 8)} className="contents">
        <CircularProgress progress={(waterOz / target) * 100} accent="sky">
          <Droplet size={14} className="mb-0.5 text-sky-400" />
          <span className="text-xs font-semibold text-neutral-50">{waterOz}oz</span>
        </CircularProgress>
      </button>
      <span className="text-xs text-neutral-400">Water · tap +8oz</span>
    </div>
  )
}

function WorkoutsRing({ target }: { target: number }) {
  const { items } = useWorkoutSessions()
  const trainedDates = new Set(items.filter((s) => s.entries.length > 0).map((s) => s.date))
  const now = new Date()
  const sunday = addDays(now, -now.getDay())
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(sunday, i), 'yyyy-MM-dd'))
  const count = weekDates.filter((d) => trainedDates.has(d)).length

  return (
    <RingTile label="Workouts" progress={(count / target) * 100} accent="emerald" to="/workouts">
      <span className="text-sm font-semibold text-neutral-50">{count}</span>
      <span className="text-[9px] text-neutral-500">/{target} wk</span>
    </RingTile>
  )
}

function TodayWidget() {
  const today = todayISO()
  const { items: defs } = useTaskDefs()
  const { items: logs } = useTaskLogs(today)
  const occurrences = sortTaskDefs(occurrencesForDate(defs, today))
  const logByTaskId = new Map(logs.map((log) => [log.taskId, log]))

  const remaining = occurrences.filter((t) => {
    const value = logByTaskId.get(t.id)?.value ?? 0
    return t.trackingType === 'quantity' ? value < (t.targetValue ?? 1) : value < 1
  })
  const doneCount = occurrences.length - remaining.length
  const progress = occurrences.length === 0 ? 0 : (doneCount / occurrences.length) * 100

  return (
    <WidgetCard title="Today" icon={<CalendarCheck size={16} />} accent="indigo" to="/today">
      <div className="flex items-center gap-3">
        <CircularProgress progress={progress} accent="indigo" size={52} strokeWidth={5}>
          <span className="text-xs font-semibold text-neutral-50">
            {doneCount}/{occurrences.length}
          </span>
        </CircularProgress>
        <div className="min-w-0 flex-1">
          {remaining.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {occurrences.length === 0 ? 'Nothing planned yet.' : 'All done for today.'}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {remaining.slice(0, 2).map((t) => (
                <li key={t.id} className="flex items-center gap-1.5 truncate text-sm text-neutral-300">
                  {t.time && <span className="text-xs text-neutral-500">{t.time}</span>}
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WidgetCard>
  )
}

