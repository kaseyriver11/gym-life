import clsx from 'clsx'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ExercisesTab } from './ExercisesTab'
import { LogTab } from './LogTab'
import { PlanTab } from './PlanTab'
import { ProgressTab } from './ProgressTab'

const TABS = [
  { key: 'log', label: 'Log' },
  { key: 'plan', label: 'Plan' },
  { key: 'exercises', label: 'Exercises' },
  { key: 'progress', label: 'Progress' },
] as const

type TabKey = (typeof TABS)[number]['key']

/** Shape of the `state` a caller (e.g. the dashboard's quick-action
 * buttons) can hand off via `<Link to="/workouts" state={...}>` to land
 * directly on a specific tab and/or open a specific flow. */
export interface WorkoutsPageNavState {
  tab?: TabKey
  autoOpen?: 'compose' | 'quickLog'
}

export function WorkoutsPage() {
  const location = useLocation()
  const navState = location.state as WorkoutsPageNavState | null
  const [tab, setTab] = useState<TabKey>(navState?.tab ?? 'log')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-neutral-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition sm:text-sm',
              tab === t.key
                ? 'bg-neutral-800 text-neutral-50'
                : 'text-neutral-500 hover:text-neutral-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' && <LogTab onGoToPlan={() => setTab('plan')} autoOpen={navState?.autoOpen} />}
      {tab === 'plan' && <PlanTab onStarted={() => setTab('log')} />}
      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'progress' && <ProgressTab />}
    </div>
  )
}
