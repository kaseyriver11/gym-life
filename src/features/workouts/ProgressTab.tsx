import { useMemo, useState } from 'react'
import { useDashboardPrefs } from '@/features/dashboard/use-dashboard-prefs'
import { useHealthSnapshots } from '@/features/health/use-health'
import { Chips } from './ProgressCharts'
import { ProgressCardio } from './ProgressCardio'
import { ProgressExercise } from './ProgressExercise'
import { ProgressOverview } from './ProgressOverview'
import { ProgressRecords } from './ProgressRecords'
import { useAllExercises } from './use-all-exercises'
import { useWorkoutSessions } from './use-workout-sessions'

type View = 'overview' | 'exercise' | 'records' | 'cardio'

const VIEWS: { key: View; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'exercise', label: 'By exercise' },
  { key: 'records', label: 'Records' },
  { key: 'cardio', label: 'Cardio' },
]

export function ProgressTab() {
  const { items: exercises } = useAllExercises()
  const { items: sessions } = useWorkoutSessions()
  const { items: snapshots } = useHealthSnapshots()
  const { targets } = useDashboardPrefs()
  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])
  const [view, setView] = useState<View>('overview')
  const [exerciseId, setExerciseId] = useState('')

  return (
    <div className="space-y-4">
      <Chips options={VIEWS} value={view} onChange={setView} />

      {view === 'overview' && (
        <ProgressOverview
          sessions={sessions}
          exercisesById={exercisesById}
          snapshots={snapshots}
          workoutsPerWeek={targets.workoutsPerWeek}
        />
      )}
      {view === 'exercise' && (
        <ProgressExercise
          sessions={sessions}
          exercisesById={exercisesById}
          snapshots={snapshots}
          exerciseId={exerciseId}
          onPick={setExerciseId}
        />
      )}
      {view === 'records' && (
        <ProgressRecords
          sessions={sessions}
          exercisesById={exercisesById}
          snapshots={snapshots}
          onOpenExercise={(id) => {
            setExerciseId(id)
            setView('exercise')
          }}
        />
      )}
      {view === 'cardio' && <ProgressCardio sessions={sessions} exercisesById={exercisesById} />}
    </div>
  )
}
