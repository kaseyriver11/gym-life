import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import type { MuscleTarget, WorkoutSession } from '@/types'
import { MUSCLE_PICKER_OPTIONS, weightsForExercise } from './body-map'
import { SCORE_SCALE, type MuscleLoad } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { MuscleRolePicker } from './MuscleRolePicker'
import { estimatedOneRepMax } from './prs'

interface FocusExercise {
  id: string
  name: string
  notes?: string
  targetMuscles?: MuscleTarget[]
  muscleGroup?: string
  muscleSubgroup?: string
  source?: 'catalog' | 'custom'
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
  const [targetMuscles, setTargetMuscles] = useState<MuscleTarget[]>(() => exercise.targetMuscles ?? [])

  const history = sessions
    .filter((s) => s.id !== excludeSessionId)
    .flatMap((s) =>
      s.entries
        .filter((e) => e.exerciseId === exercise.id)
        .map((entry) => ({ date: s.date, entry })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const heatData = new Map<string, MuscleLoad>()
  for (const { id, weight, role, measured } of weightsForExercise(exercise)) {
    heatData.set(id, {
      score: weight * SCORE_SCALE,
      exercises: new Set([exercise.name]),
      role,
      measured,
    })
  }

  function persist(nextNotes: string, nextMuscles: MuscleTarget[]) {
    onSaveNote({
      notes: nextNotes.trim() || undefined,
      // Catalog exercises have no editable picker (the muscle list up top
      // is a read-only display), so never write targetMuscles for them —
      // otherwise saving a note would freeze a snapshot of the catalog's
      // targeting at that moment into this user's personal override,
      // silently shadowing any future catalog research updates for that
      // exercise (e.g. this activationScore pass) forever.
      targetMuscles:
        exercise.source === 'catalog' ? undefined : nextMuscles.length > 0 ? nextMuscles : undefined,
    })
  }

  return (
    <Modal title={exercise.name} onClose={onClose}>
      <div className="space-y-4">
        <MuscleMapView data={heatData} size="6.5rem" unusedLabel="Not worked by this exercise" />

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
            {exercise.source === 'catalog' ? 'Muscles this hits' : 'Which muscles does this hit for you?'}
          </label>
          {exercise.source === 'catalog' ? (
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_PICKER_OPTIONS.map(({ value, label }) => {
                const active = targetMuscles.some((t) => t.muscle === value)
                return (
                  <span
                    key={value}
                    className={clsx(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      active ? 'bg-teal-600 text-white' : 'bg-neutral-800/60 text-neutral-600',
                    )}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          ) : (
            <MuscleRolePicker
              value={targetMuscles}
              onChange={(next) => {
                setTargetMuscles(next)
                persist(notes, next)
              }}
            />
          )}
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
