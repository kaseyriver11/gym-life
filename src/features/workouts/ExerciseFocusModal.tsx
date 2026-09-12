import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { Muscle } from 'react-body-highlighter'
import { Modal } from '@/components/Modal'
import type { MuscleTarget, WorkoutSession } from '@/types'
import { MUSCLE_PICKER_OPTIONS } from './body-map'
import { buildMuscleData, muscleLabel } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { estimatedOneRepMax } from './prs'

interface FocusExercise {
  id: string
  name: string
  notes?: string
  targetMuscles?: MuscleTarget[]
}

/** "Focus this exercise" view — your own notes/angle, an optional personal
 * muscle-target override, past history, and a mini heatmap for just this
 * exercise. All personalization here lives in the user's own exerciseNotes
 * doc, never the shared catalog. */
export function ExerciseFocusModal({
  exercise,
  sessions,
  excludeSessionId,
  onSaveNote,
  onClose,
}: {
  exercise: FocusExercise
  sessions: WorkoutSession[]
  excludeSessionId?: string
  onSaveNote: (data: { notes?: string; targetMuscles?: MuscleTarget[] }) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState(exercise.notes ?? '')
  const [targetMuscles, setTargetMuscles] = useState<Muscle[]>(
    () => exercise.targetMuscles?.map((t) => t.muscle as Muscle) ?? [],
  )

  const history = sessions
    .filter((s) => s.id !== excludeSessionId)
    .flatMap((s) =>
      s.entries
        .filter((e) => e.exerciseId === exercise.id)
        .map((entry) => ({ date: s.date, entry })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const heatData = buildMuscleData(
    [{ exerciseId: exercise.id, exerciseName: exercise.name, setCount: 1 }],
    new Map([[exercise.id, { targetMuscles: exercise.targetMuscles }]]),
  )

  function persist(nextNotes: string, nextMuscles: Muscle[]) {
    onSaveNote({
      notes: nextNotes.trim() || undefined,
      targetMuscles:
        nextMuscles.length > 0
          ? nextMuscles.map((muscle) => ({ muscle, role: 'primary' as const }))
          : undefined,
    })
  }

  return (
    <Modal title={exercise.name} onClose={onClose}>
      <div className="space-y-4">
        <MuscleMapView data={heatData} size="6.5rem" />

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Your notes (form cues, angle, setup)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => persist(notes, targetMuscles)}
            rows={3}
            placeholder="e.g. incline set to 3, elbows tucked, pause at chest"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Which muscles does this hit for you?{' '}
            <span className="text-neutral-600">(just for you — doesn't change the catalog)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_PICKER_OPTIONS.map((muscle) => {
              const active = targetMuscles.includes(muscle)
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? targetMuscles.filter((m) => m !== muscle)
                      : [...targetMuscles, muscle]
                    setTargetMuscles(next)
                    persist(notes, next)
                  }}
                  className={clsx(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition',
                    active
                      ? 'bg-teal-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                  )}
                >
                  {muscleLabel(muscle)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-neutral-400">Recent history</p>
          {history.length === 0 ? (
            <p className="text-sm text-neutral-600">No previous sessions logged yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map(({ date, entry }, i) => {
                const completed = entry.sets.filter((s) => s.completed)
                const best = completed.reduce(
                  (max, s) => Math.max(max, estimatedOneRepMax(s.weight, s.reps)),
                  0,
                )
                return (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="shrink-0 text-neutral-500">
                      {format(parseISO(date), 'MMM d')}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-neutral-300">
                      {completed.length > 0
                        ? completed.map((s) => `${s.reps}×${s.weight}`).join(', ')
                        : 'no sets completed'}
                    </span>
                    {best > 0 && (
                      <span className="shrink-0 text-neutral-600">~{Math.round(best)} e1RM</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
