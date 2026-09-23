import clsx from 'clsx'
import { format } from 'date-fns'
import { Watch, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/Modal'
import { primaryButtonClass } from '@/components/form'
import { formatSeconds } from '@/features/workouts/progress-stats'
import { useAllExercises } from '@/features/workouts/use-all-exercises'
import { useWorkoutSessions } from '@/features/workouts/use-workout-sessions'
import { useImportCandidates } from './use-import-candidates'
import type { WorkoutExerciseEntry } from '@/types'
import type { HealthWorkout } from './health-connect'
import {
  defaultActivity,
  dismissWorkouts,
  heartRateStats,
  prettyType,
  workoutKey,
  workoutLocalDate,
  workoutToSet,
} from './health-import'

/** Log-tab nudge: shows only when there's something new to import. */
export function HealthImportBanner() {
  const importer = useImportCandidates()
  const [open, setOpen] = useState(false)
  if (!importer.linked || importer.candidates.length === 0) return null
  const n = importer.candidates.length
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-left"
      >
        <Watch size={16} className="shrink-0 text-sky-300" />
        <span className="min-w-0 flex-1 text-xs text-sky-200">
          {n} new workout{n === 1 ? '' : 's'} from your watch
        </span>
        <span className="text-xs font-medium text-sky-300">Review</span>
      </button>
      {open && <ImportWorkoutsModal importer={importer} onClose={() => setOpen(false)} />}
    </>
  )
}

export function ImportWorkoutsModal({
  importer,
  onClose,
}: {
  importer: ReturnType<typeof useImportCandidates>
  onClose: () => void
}) {
  const { candidates, skippedCount, status, error } = importer
  const { items: exercises } = useAllExercises()
  const { items: sessions, add, update } = useWorkoutSessions()
  const cardio = useMemo(
    () => exercises.filter((e) => e.muscleGroup === 'Cardio').sort((a, b) => a.name.localeCompare(b.name)),
    [exercises],
  )
  const cardioByName = useMemo(() => new Map(cardio.map((e) => [e.name, e])), [cardio])

  // Per-workout choices: include?, and which activity to log it as.
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [activityFor, setActivityFor] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const activityId = (w: HealthWorkout) =>
    activityFor[workoutKey(w)] ?? cardioByName.get(defaultActivity(w))?.id ?? cardioByName.get('Other Cardio')?.id ?? ''
  const chosen = candidates.filter((w) => !excluded.has(workoutKey(w)) && activityId(w))

  async function importChosen() {
    setSaving(true)
    try {
      // Group by day — one session per date, same as everything else.
      const byDate = new Map<string, WorkoutExerciseEntry[]>()
      const spanByDate = new Map<string, { start: number; end: number }>()
      for (const w of [...chosen].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
        const date = workoutLocalDate(w)
        const ex = cardio.find((e) => e.id === activityId(w))!
        byDate.set(date, [...(byDate.get(date) ?? []), { exerciseId: ex.id, exerciseName: ex.name, sets: [workoutToSet(w)] }])
        const start = new Date(w.startDate).getTime()
        const end = new Date(w.endDate).getTime()
        const span = spanByDate.get(date)
        spanByDate.set(date, { start: Math.min(span?.start ?? start, start), end: Math.max(span?.end ?? end, end) })
      }
      const now = Date.now()
      for (const [date, entries] of byDate) {
        const existing = sessions.find((s) => s.date === date)
        if (existing) {
          await update(existing.id, { entries: [...existing.entries, ...entries], updatedAt: now })
        } else {
          // A day with only watch cardio: the session spans the workouts
          // themselves, already finished, so its clock reads right.
          const span = spanByDate.get(date)!
          await add({ date, entries, createdAt: span.start, endedAt: span.end, updatedAt: now })
        }
      }
      const skipped = candidates.filter((w) => excluded.has(workoutKey(w))).map(workoutKey)
      if (skipped.length > 0) {
        await dismissWorkouts(skipped)
        importer.forget(skipped)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function dismissOne(w: HealthWorkout) {
    await dismissWorkouts([workoutKey(w)])
    importer.forget([workoutKey(w)])
  }

  return (
    <Modal title="Import from Health Connect" onClose={onClose}>
      <div className="space-y-3">
        {status === 'loading' && <p className="text-sm text-neutral-400">Reading workouts…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {status !== 'loading' && candidates.length === 0 && !error && (
          <p className="text-sm text-neutral-400">Nothing new from the last two weeks — you're all caught up.</p>
        )}
        {cardio.length === 0 && candidates.length > 0 && (
          <p className="text-sm text-amber-300">Cardio activities haven't loaded yet — try again in a moment.</p>
        )}

        <ul className="space-y-2">
          {candidates.map((w) => {
            const key = workoutKey(w)
            const on = !excluded.has(key)
            const { avg, max } = heartRateStats(w)
            const miles = w.distance ? (w.distance / 1609.344).toFixed(2) : null
            const pace = w.distance && w.duration ? w.duration / (w.distance / 1609.344) : null
            return (
              <li
                key={key}
                className={clsx(
                  'rounded-xl border p-2.5 transition',
                  on ? 'border-sky-500/30 bg-sky-500/5' : 'border-neutral-800 bg-neutral-900 opacity-60',
                )}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setExcluded((prev) => {
                        const next = new Set(prev)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        return next
                      })
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-sky-500"
                    aria-label="Import this workout"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-400">
                      {format(new Date(w.startDate), 'EEE, MMM d · h:mm a')} · {prettyType(w.workoutType)}
                      {w.title ? ` · “${w.title}”` : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-100">
                      {formatSeconds(w.duration)}
                      {miles && ` · ${miles} mi`}
                      {pace && ` · ${formatSeconds(pace)}/mi`}
                      {avg != null && ` · ${avg} bpm avg`}
                      {max != null && ` / ${max} max`}
                      {w.calories > 0 && ` · ${Math.round(w.calories)} cal`}
                    </p>
                    <select
                      value={activityId(w)}
                      onChange={(e) => setActivityFor((prev) => ({ ...prev, [key]: e.target.value }))}
                      disabled={!on}
                      className="mt-1.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100"
                    >
                      {cardio.map((c) => (
                        <option key={c.id} value={c.id}>
                          Log as: {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => dismissOne(w)}
                    className="shrink-0 text-neutral-600 hover:text-neutral-300"
                    aria-label="Don't show this workout again"
                    title="Don't show again"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {skippedCount > 0 && (
          <p className="text-[11px] text-neutral-500">
            {skippedCount} strength/yoga session{skippedCount === 1 ? '' : 's'} from your watch not shown — those are
            logged set by set here.
          </p>
        )}

        {candidates.length > 0 && (
          <button onClick={importChosen} disabled={saving || chosen.length === 0} className={primaryButtonClass}>
            {saving ? 'Importing…' : `Import ${chosen.length} workout${chosen.length === 1 ? '' : 's'}`}
          </button>
        )}
        {candidates.length > 0 && (
          <p className="text-center text-[11px] text-neutral-600">Unchecked workouts won't be offered again.</p>
        )}
      </div>
    </Modal>
  )
}
