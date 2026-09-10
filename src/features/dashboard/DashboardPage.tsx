import { format, subDays } from 'date-fns'
import { CalendarCheck, Dumbbell, HeartPulse, ListTodo } from 'lucide-react'
import { WidgetCard } from '@/components/WidgetCard'
import { sortDailyTasks, useDailyTasks } from '@/features/daily/use-daily-tasks'
import { useHealthSnapshots } from '@/features/health/use-health'
import {
  CATEGORY_LABELS,
  useLongTermTasks,
} from '@/features/longterm/use-long-term-tasks'
import { useWorkoutSessions } from '@/features/workouts/use-workout-sessions'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function DashboardPage() {
  return (
    <div className="space-y-3">
      <TodayWidget />
      <LongTermWidget />
      <WorkoutWidget />
      <HealthWidget />
    </div>
  )
}

function TodayWidget() {
  const { items } = useDailyTasks(todayISO())
  const sorted = sortDailyTasks(items)
  const remaining = sorted.filter((t) => !t.completed)

  return (
    <WidgetCard title="Today" icon={<CalendarCheck size={16} />} to="/today">
      <p className="mb-2 text-2xl font-semibold text-neutral-50">
        {items.length - remaining.length}
        <span className="text-base font-normal text-neutral-500">/{items.length} done</span>
      </p>
      {remaining.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {items.length === 0 ? 'Nothing planned yet.' : 'All done for today.'}
        </p>
      ) : (
        <ul className="space-y-1">
          {remaining.slice(0, 3).map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm text-neutral-300">
              {t.time && <span className="text-xs text-neutral-500">{t.time}</span>}
              <span className="truncate">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

function LongTermWidget() {
  const { items } = useLongTermTasks()
  const open = items.filter((t) => !t.completed)
  const byCategory = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    label,
    count: open.filter((t) => t.category === key).length,
  }))

  return (
    <WidgetCard title="The list" icon={<ListTodo size={16} />} to="/list">
      <p className="mb-2 text-2xl font-semibold text-neutral-50">
        {open.length} <span className="text-base font-normal text-neutral-500">open</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {byCategory
          .filter((c) => c.count > 0)
          .map((c) => (
            <span
              key={c.label}
              className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
            >
              {c.label} · {c.count}
            </span>
          ))}
        {open.length === 0 && <p className="text-sm text-neutral-500">All caught up.</p>}
      </div>
    </WidgetCard>
  )
}

function WorkoutWidget() {
  const { items } = useWorkoutSessions()
  const today = todayISO()
  const trained = new Set(
    items.filter((s) => s.entries.length > 0).map((s) => s.date),
  )

  let streak = 0
  let cursor = trained.has(today) ? new Date() : subDays(new Date(), 1)
  while (trained.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  const trainedToday = trained.has(today)

  return (
    <WidgetCard title="Workouts" icon={<Dumbbell size={16} />} to="/workouts">
      <p className="mb-1 text-2xl font-semibold text-neutral-50">
        {streak} <span className="text-base font-normal text-neutral-500">day streak</span>
      </p>
      <p className="text-sm text-neutral-500">
        {trainedToday ? "Logged today. Nice." : 'Nothing logged today yet.'}
      </p>
    </WidgetCard>
  )
}

function HealthWidget() {
  const { items } = useHealthSnapshots()
  const today = todayISO()
  const snapshot = items.find((s) => s.date === today)

  return (
    <WidgetCard title="Health" icon={<HeartPulse size={16} />} to="/health">
      {snapshot ? (
        <div className="flex gap-4 text-sm text-neutral-300">
          {snapshot.weightLbs != null && <span>{snapshot.weightLbs} lbs</span>}
          {snapshot.steps != null && <span>{snapshot.steps.toLocaleString()} steps</span>}
          {snapshot.caloriesIn != null && <span>{snapshot.caloriesIn} kcal</span>}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No data logged today.</p>
      )}
    </WidgetCard>
  )
}
