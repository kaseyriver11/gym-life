import clsx from 'clsx'
import { useState } from 'react'
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

export function WorkoutsPage() {
  const [tab, setTab] = useState<TabKey>('log')

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

      {tab === 'log' && <LogTab onGoToPlan={() => setTab('plan')} />}
      {tab === 'plan' && <PlanTab onStarted={() => setTab('log')} />}
      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'progress' && <ProgressTab />}
    </div>
  )
}
