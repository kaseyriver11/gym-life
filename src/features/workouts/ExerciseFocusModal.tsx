import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { Modal } from '@/components/Modal'
import type { MuscleTarget, WorkoutSession, WorkoutSet } from '@/types'
import { weightsForExercise } from './body-map'
import { SCORE_SCALE, type MuscleLoad } from './muscle-heat'
import { isDurationBased } from './muscle-groups'
import { MuscleMapView } from './MuscleMapView'
import { MuscleRolePicker } from './MuscleRolePicker'
import { formatSeconds } from './progress-stats'
import {
  isUnilateral,
  loggedHistory,
  suggestSets,
  workingRange,
  type LoggedSession,
  type SuggestedSet,
} from './progression'
import { estimatedOneRepMax } from './prs'

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
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
  perSide?: boolean
  source?: 'catalog' | 'custom'
}

/** "3×12 @ 55" style one-liner for a list of sets — sides marked L/R. */
function setsLine(sets: (WorkoutSet | SuggestedSet)[], timed: boolean): string {
  if (sets.length === 0) return '—'
  return sets
    .map((s) => {
      const side = s.side ? (s.side === 'left' ? 'L ' : 'R ') : ''
      if (timed) return `${side}${formatSeconds(s.durationSeconds ?? 0)}`
      if (s.reps === 0 && s.weight === 0) return `${side}—`
      return `${side}${s.reps}×${s.weight || 'BW'}`
    })
    .join(', ')
}

const TYPICAL_WINDOW = 5

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Your typical session over the last few: set by set, the median reps and
 * weight of that set across sessions (shaped like the most recent one).
 * Medians, so one odd day doesn't skew it. */
function typicalSets(history: LoggedSession[]): SuggestedSet[] {
  const recent = history.slice(0, TYPICAL_WINDOW)
  if (recent.length < 2) return []
  return recent[0].sets.map((set, i) => {
    const same = recent.map((h) => h.sets[i]).filter((s): s is WorkoutSet => !!s)
    return {
      reps: Math.round(median(same.map((s) => s.reps))),
      weight: Math.round(median(same.map((s) => s.weight)) * 2) / 2,
      durationSeconds: Math.round(median(same.map((s) => s.durationSeconds ?? 0))),
      ...(set.side ? { side: set.side } : {}),
    }
  })
}

/** Last time, today's suggestion, and the trend — what's actually useful
 * mid-workout. The full session-by-session list lives at the bottom of the
 * view (HistoryList). */
function TodayCard({
  exercise,
  sessions,
  asOfDate,
}: {
  exercise: FocusExercise
  sessions: WorkoutSession[]
  asOfDate?: string
}) {
  const before = useMemo(
    () => (asOfDate ? sessions.filter((s) => s.date < asOfDate) : sessions),
    [sessions, asOfDate],
  )
  const timed = isDurationBased(exercise.muscleGroup)
  const history = useMemo(() => loggedHistory(before, exercise.id), [before, exercise.id])
  const oneSide = isUnilateral(before, exercise.id, exercise)
  const suggestion = useMemo(() => suggestSets(before, exercise.id, exercise), [before, exercise])
  const last = history.find((h) => h.sided === oneSide) ?? history[0]
  const sameWay = useMemo(() => history.filter((h) => h.sided === oneSide), [history, oneSide])
  const range = workingRange(sameWay, exercise)
  const typical = useMemo(() => typicalSets(sameWay), [sameWay])

  // Best estimated 1RM per session, oldest first, for the sparkline.
  const trend = useMemo(
    () =>
      [...history]
        .reverse()
        .slice(-10)
        .map((h) => ({
          date: h.date,
          value: timed
            ? Math.max(...h.sets.map((s) => s.durationSeconds ?? 0))
            : Math.round(Math.max(...h.sets.map((s) => estimatedOneRepMax(s.weight, s.reps)))),
        }))
        .filter((p) => p.value > 0),
    [history, timed],
  )
  const best = trend.reduce((m, p) => Math.max(m, p.value), 0)

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 text-sm text-neutral-500">
        First time logging this — enter your first set and the rest will follow it.
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-neutral-500">
            Last time · {format(parseISO(last.date), 'MMM d')} · {history.length} session{history.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-neutral-200">{setsLine(last.sets, timed)}</p>
          {typical.length > 0 && (
            <>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Typical · last {Math.min(TYPICAL_WINDOW, sameWay.length)} sessions
              </p>
              <p className="text-sm text-neutral-300">{setsLine(typical, timed)}</p>
            </>
          )}
        </div>
        {trend.length >= 2 && (
          <div className="w-24 shrink-0">
            <div className="h-9">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke="#2dd4bf"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-right text-[10px] text-neutral-500">
              best {timed ? formatSeconds(best) : `~${best} e1RM`}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-neutral-800 pt-2">
        <p className="text-[11px] text-teal-400">
          Suggested today{oneSide ? ' · one side at a time' : ''}
          {!timed && (
            <span className="text-neutral-500">
              {' '}
              · {range.low}–{range.high} reps{range.personal ? ' (your usual)' : ''}
            </span>
          )}
        </p>
        <p className="text-sm font-medium text-neutral-100">{setsLine(suggestion, timed)}</p>
      </div>
    </div>
  )
}

const HISTORY_PAGE = 10

/** Every past session of this exercise, newest first — each set as logged,
 * so you can see how the numbers actually moved, not just last time. */
function HistoryList({
  exercise,
  sessions,
  asOfDate,
}: {
  exercise: FocusExercise
  sessions: WorkoutSession[]
  asOfDate?: string
}) {
  const [shown, setShown] = useState(HISTORY_PAGE)
  const history = useMemo(
    () => loggedHistory(asOfDate ? sessions.filter((s) => s.date < asOfDate) : sessions, exercise.id),
    [sessions, asOfDate, exercise.id],
  )
  if (history.length === 0) return null
  const timed = isDurationBased(exercise.muscleGroup)

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <p className="mb-2 text-xs font-medium text-neutral-400">History</p>
      <ul className="divide-y divide-neutral-800">
        {history.slice(0, shown).map((h) => (
          <li key={h.date} className="flex gap-3 py-2 first:pt-0 last:pb-0">
            <span className="w-14 shrink-0 text-xs tabular-nums text-neutral-500">
              {format(parseISO(h.date), 'MMM d')}
              {parseISO(h.date).getFullYear() !== new Date().getFullYear() && (
                <span className="block text-[10px]">{format(parseISO(h.date), 'yyyy')}</span>
              )}
            </span>
            <span className="min-w-0 flex-1 text-sm tabular-nums text-neutral-200">{setsLine(h.sets, timed)}</span>
          </li>
        ))}
      </ul>
      {history.length > shown && (
        <button
          onClick={() => setShown((n) => n + HISTORY_PAGE)}
          className="mt-2 text-xs text-indigo-400 hover:underline"
        >
          Show more ({history.length - shown} older)
        </button>
      )}
    </div>
  )
}

/** "Focus this exercise" view — last time, today's suggestion and trend;
 * form cues; your own cues/notes; the muscle breakdown; and full history.
 * All personalization here lives in the user's own exerciseNotes doc,
 * never the shared catalog. */
export function ExerciseFocusModal({
  exercise,
  sessions,
  asOfDate,
  onSaveNote,
  onClose,
}: {
  exercise: FocusExercise
  sessions: WorkoutSession[]
  /** Suggestions/history are as of this date (the day being logged), so
   * today's own sets don't count as "last time". */
  asOfDate?: string
  onSaveNote: (data: { notes?: string; cues?: string; targetMuscles?: MuscleTarget[] }) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState(exercise.notes ?? '')
  const [cues, setCues] = useState(exercise.cues ?? '')
  const [targetMuscles, setTargetMuscles] = useState<MuscleTarget[]>(() => exercise.targetMuscles ?? [])
  // Catalog exercises can have a demo image bundled at
  // public/exercise-images/<catalog id>.webp — hidden if there isn't one.
  const [imageMissing, setImageMissing] = useState(exercise.source !== 'catalog')

  const heatData = new Map<string, MuscleLoad>()
  for (const { id, weight, role, measured } of weightsForExercise(exercise)) {
    heatData.set(id, {
      score: weight * SCORE_SCALE,
      exercises: new Set([exercise.name]),
      role,
      measured,
    })
  }
  const sortedMuscles = [...targetMuscles].sort(
    (a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || (b.activationScore ?? 0) - (a.activationScore ?? 0),
  )
  const primaryNames = sortedMuscles.filter((t) => t.role === 'primary').map((t) => t.muscle)

  function persist(nextNotes: string, nextCues: string, nextMuscles: MuscleTarget[]) {
    onSaveNote({
      notes: nextNotes.trim(),
      cues: nextCues.trim(),
      // Catalog exercises have no editable picker (the muscle list is a
      // read-only display), so never write targetMuscles for them —
      // otherwise saving a note would freeze a snapshot of the catalog's
      // targeting into this user's personal override, silently shadowing
      // any future catalog research updates for that exercise.
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

        <TodayCard exercise={exercise} sessions={sessions} asOfDate={asOfDate} />

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
            Your cues (one per line — shown on the card; also editable there)
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
            Notes (setup details — not shown on the card)
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

        <div className="rounded-lg border border-neutral-800">
          <div className="flex w-full items-center gap-2 px-3 py-2">
            <span className="shrink-0 text-xs font-medium text-neutral-400">Muscles</span>
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">
              {primaryNames.length > 0 ? primaryNames.join(', ') : exercise.muscleGroup ?? '—'}
            </span>
          </div>
          <div className="space-y-3 border-t border-neutral-800 p-3">
              <MuscleMapView data={heatData} size="5rem" unusedLabel="Not worked by this exercise" />
              {exercise.source === 'catalog' ? (
                <div className="space-y-1">
                  {sortedMuscles.length === 0 ? (
                    <p className="text-xs text-neutral-500">No muscle data yet.</p>
                  ) : (
                    sortedMuscles.map((t) => (
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
        </div>

        <HistoryList exercise={exercise} sessions={sessions} asOfDate={asOfDate} />
      </div>
    </Modal>
  )
}
