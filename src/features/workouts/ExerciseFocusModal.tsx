import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import type { MuscleTarget, WorkoutSession } from '@/types'
import { weightsForExercise } from './body-map'
import { SCORE_SCALE, type MuscleLoad } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { MuscleRolePicker } from './MuscleRolePicker'
import { estimatedOneRepMax } from './prs'
import { isSetLogged } from './use-workout-sessions'

const ROLE_RANK: Record<MuscleTarget['role'], number> = { primary: 0, secondary: 1, stabilizer: 2 }
const ROLE_LABEL: Record<MuscleTarget['role'], string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  stabilizer: 'Stabilizer',
}
const ROLE_COLOR: Record<MuscleTarget['role'], string> = {
  primary: 'text-teal-400',
  secondary: 'text-neutral-400',
  stabilizer: 'text-neutral-500',
}

interface FocusExercise {
  id: string
  name: string
  notes?: string
  cues?: string
  formCues?: string[]
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
  onSaveNote: (data: { notes?: string; cues?: string; targetMuscles?: MuscleTarget[] }) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState(exercise.notes ?? '')
  const [cues, setCues] = useState(exercise.cues ?? '')
  const [targetMuscles, setTargetMuscles] = useState<MuscleTarget[]>(() => exercise.targetMuscles ?? [])
  // Catalog exercises can have a demo image bundled at
  // public/exercise-images/<catalog id>.webp — hidden if there isn't one.
  const [imageMissing, setImageMissing] = useState(exercise.source !== 'catalog')

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

  function persist(nextNotes: string, nextCues: string, nextMuscles: MuscleTarget[]) {
    onSaveNote({
      notes: nextNotes.trim() || undefined,
      cues: nextCues.trim() || undefined,
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
        {!imageMissing && (
          <img
            src={`${import.meta.env.BASE_URL}exercise-images/${exercise.id}.webp`}
            alt={`${exercise.name} demonstration`}
            onError={() => setImageMissing(true)}
            className="w-full rounded-lg bg-neutral-950"
          />
        )}

        <MuscleMapView data={heatData} size="6.5rem" unusedLabel="Not worked by this exercise" />

        {exercise.formCues && exercise.formCues.length > 0 && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
            <p className="mb-1.5 text-xs font-medium text-neutral-400">Form</p>
            <ul className="space-y-1.5">
              {exercise.formCues.map((cue) => {
                const pinned = cues.split('\n').some((line) => line.trim() === cue)
                return (
                  <li key={cue} className="flex items-start gap-2 text-sm text-neutral-200">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-400" />
                    <span className="min-w-0 flex-1">{cue}</span>
                    <button
                      onClick={() => {
                        if (pinned) return
                        const next = cues.trim() ? `${cues.trim()}\n${cue}` : cue
                        setCues(next)
                        persist(notes, next, targetMuscles)
                      }}
                      disabled={pinned}
                      className={clsx(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        pinned ? 'text-neutral-600' : 'bg-teal-500/15 text-teal-300 hover:bg-teal-500/25',
                      )}
                      title="Show this cue on the exercise card while you log"
                    >
                      {pinned ? 'On card' : 'Pin'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Cues (one per line — shown on the card while you log)
          </label>
          <textarea
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            onBlur={() => persist(notes, cues, targetMuscles)}
            rows={3}
            placeholder={'e.g.\nElbows tucked\nPause at chest\nDrive through heels'}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Notes (setup details, history — not shown on the card)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => persist(notes, cues, targetMuscles)}
            rows={2}
            placeholder="e.g. incline set to 3, seat height 4"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            {exercise.source === 'catalog' ? 'Muscles this hits' : 'Which muscles does this hit for you?'}
          </label>
          {exercise.source === 'catalog' ? (
            <div className="space-y-1 rounded-lg bg-neutral-800/60 px-3 py-2">
              {targetMuscles.length === 0 ? (
                <p className="text-xs text-neutral-500">No muscle data yet.</p>
              ) : (
                [...targetMuscles]
                  .sort(
                    (a, b) =>
                      ROLE_RANK[a.role] - ROLE_RANK[b.role] ||
                      (b.activationScore ?? 0) - (a.activationScore ?? 0),
                  )
                  .map((t) => (
                    <div key={t.muscle} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-300">{t.muscle}</span>
                      <span className={clsx('shrink-0 font-medium', ROLE_COLOR[t.role])}>
                        {ROLE_LABEL[t.role]}
                        {t.activationScore != null && ` · ${Math.round(t.activationScore * 100)}%`}
                      </span>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <MuscleRolePicker
              value={targetMuscles}
              onChange={(next) => {
                setTargetMuscles(next)
                persist(notes, cues, next)
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
                const completed = entry.sets.filter(isSetLogged)
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
                        : 'no sets logged'}
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
