import clsx from 'clsx'
import { format } from 'date-fns'
import { ListPlus, NotebookText, Plus, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { NextUpCard } from '@/features/workouts/Programs'
import { GoalModal, GoalRing } from './GoalWidget'
import { TodayChecklist } from './TodayChecklist'
import { useDashboardPrefs } from './use-dashboard-prefs'
import { useGoals } from './use-goals'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { hidden, toggle } = useDashboardPrefs()
  const { items: goals, add: addGoal } = useGoals()
  const [customizing, setCustomizing] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)

  const show = (key: string) => !hidden.includes(key)
  const visibleGoals = goals.filter((g) => show(`goal:${g.id}`))

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

      <NextUpCard />

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          to="/workouts"
          state={{ autoOpen: 'compose' }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 py-4 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          <ListPlus size={18} />
          <span className="text-xs font-medium">Compose a workout</span>
        </Link>
        <Link
          to="/workouts"
          state={{ tab: 'plan' }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 py-4 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          <NotebookText size={18} />
          <span className="text-xs font-medium">Start a saved workout</span>
        </Link>
      </div>

      {customizing && (
        <div className="space-y-2 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-4">
          <p className="text-xs font-medium text-neutral-400">Goals shown on the home page</p>
          {goals.length === 0 && (
            <p className="text-sm text-neutral-500">No goals yet — add one below.</p>
          )}
          {goals.map((g) => (
            <label
              key={g.id}
              className="flex items-center justify-between py-1 text-sm text-neutral-300"
            >
              {g.title}
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
          <p className="pt-1 text-xs text-neutral-600">
            Steps, water, and workouts-this-week now live on the Health tab.
          </p>
        </div>
      )}

      {visibleGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {visibleGoals.map((g) => (
            <GoalRing key={g.id} goal={g} />
          ))}
        </div>
      )}

      <TodayChecklist />

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
