import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { primaryButtonClass } from '@/components/form'
import type { UserProfile, WorkoutExerciseEntry, WorkoutSession } from '@/types'
import { estimateSessionCalories } from './calories'
import { muscleGroupStyle } from './muscle-groups'
import { buildMuscleData } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { bestEstimatedOneRepMax, estimatedOneRepMax } from './prs'
import { effectiveDurationSeconds } from './session-time'
import { countSets, isSetLogged } from './use-workout-sessions'

type ExerciseInfo = { name: string; muscleGroup?: string; equipment?: string }
type ViewMode = 'ledger' | 'scoreboard'

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) return 'Not timed'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString()
  const ss = seconds.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** A set counts as "performed" for this summary if it has real numbers in
 * it — not gated on the completed toggle, since plenty of real logging
 * (reps/weight typed in, checkbox never tapped) would otherwise read as an
 * empty workout — and never an untouched greyed-out suggestion. Same rule
 * (isSetLogged) as every other stat in the app. */
function performedSets(entry: WorkoutExerciseEntry, isCardio: boolean) {
  return entry.sets.filter((s) => isSetLogged(s) && (isCardio ? (s.durationSeconds ?? 0) > 0 : s.reps > 0))
}

/** The weight actually moved for volume/e1RM purposes — for a bodyweight
 * exercise that's your logged bodyweight plus whatever's added (a vest, a
 * dip belt), not the bare `weight` field, which only ever holds the added
 * part and reads as 0 for plain push-ups/pull-ups/dips. Without this a
 * bodyweight set shows no volume at all, making real work look like it
 * never happened. */
function effectiveWeight(set: { weight: number }, isBodyweight: boolean, weightLbs?: number) {
  return isBodyweight ? (weightLbs ?? 0) + set.weight : set.weight
}

function setsSummary(entry: WorkoutExerciseEntry, isCardio: boolean) {
  if (isCardio) {
    const logged = entry.sets.filter(isSetLogged)
    const totalMin = logged.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60
    const totalMiles = logged.reduce((sum, s) => sum + (s.distanceMiles ?? 0), 0)
    const parts = [totalMin > 0 ? `${Math.round(totalMin)} min` : null, totalMiles > 0 ? `${totalMiles} mi` : null]
    return parts.filter(Boolean).join(' · ') || 'logged'
  }
  const bySide = entry.sets.some((s) => s.side)
  return entry.sets
    .filter(isSetLogged)
    .map((s) => `${s.reps}${bySide && s.side ? s.side[0].toUpperCase() : ''}×${s.weight || 'BW'}`)
    .join(' ')
}

export function PostWorkoutSummaryModal({
  session,
  sessions,
  exercisesById,
  weightLbs,
  profile,
  onClose,
}: {
  session: WorkoutSession
  sessions: WorkoutSession[]
  exercisesById: Map<string, ExerciseInfo>
  weightLbs?: number
  /** Optional age/height/sex to personalize the calorie estimate — see
   * calories.ts. Missing/incomplete falls back to a plain weight estimate. */
  profile?: UserProfile
  onClose: () => void
}) {
  const [view, setView] = useState<ViewMode>('ledger')

  const stats = useMemo(() => {
    const muscleGroups = new Map<string, number>()
    const exerciseRows = session.entries.map((entry) => {
      const info = exercisesById.get(entry.exerciseId)
      const isCardio = info?.muscleGroup === 'Cardio'
      const sets = performedSets(entry, isCardio)
      if (info?.muscleGroup) muscleGroups.set(info.muscleGroup, (muscleGroups.get(info.muscleGroup) ?? 0) + 1)

      // Volume counts bodyweight so a set of push-ups doesn't read as "0 lb
      // worked" — but the e1RM PR comparison below stays off the raw
      // weight field, same as historical sets, so bodyweight exercises
      // aren't comparing today's bodyweight-inclusive number against a
      // tiny historical one that never had bodyweight added to it.
      const isBodyweight = info?.equipment === 'Bodyweight'
      let volume = 0
      let todayBest = 0
      if (!isCardio) {
        for (const s of sets) {
          volume += s.reps * effectiveWeight(s, isBodyweight, weightLbs)
          todayBest = Math.max(todayBest, estimatedOneRepMax(s.weight, s.reps))
        }
      }
      const historicalBest = isCardio
        ? 0
        : bestEstimatedOneRepMax(sessions, entry.exerciseId, session.id)

      return { entry, info, isCardio, sets, volume, todayBest, historicalBest }
    })
    const totalVolume = exerciseRows.reduce((sum, r) => sum + r.volume, 0)
    const totalSets = exerciseRows.reduce((sum, r) => sum + countSets(r.sets), 0)
    return { totalVolume, totalSets, muscleGroups, exerciseRows }
  }, [session, sessions, exercisesById, weightLbs])

  const durationSeconds = effectiveDurationSeconds(session, Date.now())

  const calories =
    weightLbs && session.entries.length > 0
      ? estimateSessionCalories(session, exercisesById, weightLbs, profile)
      : null

  // Average "% of your best" across exercises that have prior history — the
  // point being that 10×225 on squat and 10×115 on overhead press aren't
  // comparable in absolute pounds, but each as a share of your own
  // best-ever on that lift puts them on the same scale.
  const effort = useMemo(() => {
    const withHistory = stats.exerciseRows.filter((r) => !r.isCardio && r.historicalBest > 0 && r.todayBest > 0)
    if (withHistory.length === 0) return null
    const avg =
      withHistory.reduce((sum, r) => sum + r.todayBest / r.historicalBest, 0) / withHistory.length
    return Math.round(avg * 100)
  }, [stats])

  const topLift = useMemo(() => {
    const lifts = stats.exerciseRows.filter((r) => !r.isCardio && r.todayBest > 0)
    if (lifts.length === 0) return null
    return lifts.reduce((best, r) => (r.todayBest > best.todayBest ? r : best), lifts[0])
  }, [stats])

  const muscleMapData = useMemo(
    () =>
      buildMuscleData(
        session.entries.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          setCount: performedSets(e, exercisesById.get(e.exerciseId)?.muscleGroup === 'Cardio').length,
        })),
        exercisesById,
      ),
    [session, exercisesById],
  )

  function share() {
    const lines = [
      `${session.title ?? 'Workout'} — ${format(parseISO(session.date), 'MMM d, yyyy')}`,
      `${formatDuration(durationSeconds)} · ${stats.totalSets} sets · ${stats.totalVolume.toLocaleString()} lbs moved`,
      ...stats.exerciseRows.map((r) => `${r.info?.name ?? r.entry.exerciseName}: ${setsSummary(r.entry, r.isCardio)}`),
    ]
    const text = lines.join('\n')
    if (navigator.share) {
      navigator.share({ title: 'Workout summary', text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  /** Groups consecutive entries sharing a supersetGroup so they can render
   * inside one shared bracket instead of two separately-bordered cards
   * joined by an easy-to-miss thin line. */
  const rowGroups = useMemo(() => {
    const groups: { key: string; rows: typeof stats.exerciseRows }[] = []
    stats.exerciseRows.forEach((row, i) => {
      const last = groups[groups.length - 1]
      const lastRow = last?.rows[last.rows.length - 1]
      if (
        row.entry.supersetGroup != null &&
        lastRow &&
        lastRow.entry.supersetGroup === row.entry.supersetGroup
      ) {
        last.rows.push(row)
      } else {
        groups.push({ key: `${row.entry.exerciseId}-${i}`, rows: [row] })
      }
    })
    return groups
  }, [stats.exerciseRows])

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-neutral-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex rounded-full border border-neutral-800 bg-neutral-900 p-0.5 text-xs font-medium">
            {(['ledger', 'scoreboard'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={clsx(
                  'rounded-full px-3 py-1 capitalize transition',
                  view === mode ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-300"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {view === 'ledger' ? (
          <LedgerView
            session={session}
            stats={stats}
            rowGroups={rowGroups}
            durationSeconds={durationSeconds}
            calories={calories}
            effort={effort}
            weightLbs={weightLbs}
            muscleMapData={muscleMapData}
          />
        ) : (
          <ScoreboardView
            session={session}
            stats={stats}
            rowGroups={rowGroups}
            durationSeconds={durationSeconds}
            calories={calories}
            effort={effort}
            topLift={topLift}
          />
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={share}
            className="flex-1 rounded-xl border border-neutral-700 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-900"
          >
            Share
          </button>
          <button onClick={onClose} className={clsx(primaryButtonClass, 'flex-1')}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

type Stats = {
  totalVolume: number
  totalSets: number
  muscleGroups: Map<string, number>
  exerciseRows: {
    entry: WorkoutExerciseEntry
    info: ExerciseInfo | undefined
    isCardio: boolean
    sets: WorkoutExerciseEntry['sets']
    volume: number
    todayBest: number
    historicalBest: number
  }[]
}

/** Renders one superset-bracketed run of lift rows, shared by both view
 * modes — a single outer bordered wrapper with a dashed seam between the
 * cards inside it, instead of two independently-bordered cards that only
 * hint at being linked. */
function LiftRowGroup({
  rows,
  renderRow,
}: {
  rows: Stats['exerciseRows']
  renderRow: (row: Stats['exerciseRows'][number]) => React.ReactNode
}) {
  if (rows.length === 1) return <>{renderRow(rows[0])}</>
  return (
    <div className="space-y-0 rounded-xl border-2 border-neutral-100/30 bg-white/[0.03] p-1.5">
      {rows.map((row, i) => (
        <div key={i}>
          {renderRow(row)}
          {i < rows.length - 1 && (
            <div className="my-1.5 flex items-center gap-2 px-2">
              <div
                className="h-px flex-1 opacity-50"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, white 0, white 5px, transparent 5px, transparent 10px)',
                }}
              />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                superset
              </span>
              <div
                className="h-px flex-1 opacity-50"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, white 0, white 5px, transparent 5px, transparent 10px)',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ===================== LEDGER ===================== */

function LedgerView({
  session,
  stats,
  rowGroups,
  durationSeconds,
  calories,
  effort,
  weightLbs,
  muscleMapData,
}: {
  session: WorkoutSession
  stats: Stats
  rowGroups: { key: string; rows: Stats['exerciseRows'] }[]
  durationSeconds: number | null
  calories: number | null
  effort: number | null
  weightLbs?: number
  muscleMapData: ReturnType<typeof buildMuscleData>
}) {
  return (
    <div>
      <p className="text-lg font-semibold text-neutral-50">{session.title || 'Workout summary'}</p>
      <p className="mb-3 text-xs text-neutral-500">{format(parseISO(session.date), 'EEEE, MMMM d')}</p>

      {muscleMapData.size > 0 && (
        <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <MuscleMapView data={muscleMapData} size="7rem" unusedLabel="Not worked today" />
        </div>
      )}

      <div className="mb-4">
        <div
          className={clsx(
            'font-bold tabular-nums tracking-tight text-neutral-50',
            durationSeconds == null ? 'text-xl' : 'text-4xl',
          )}
        >
          {formatDuration(durationSeconds)}
        </div>
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Total duration
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center">
          <div className="text-xl font-bold tabular-nums text-neutral-50">
            {calories != null ? `~${calories}` : '—'}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Est. calories</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center">
          <div className="text-xl font-bold tabular-nums text-neutral-50">
            {stats.totalVolume.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Lbs moved</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center">
          <div className="text-xl font-bold tabular-nums text-neutral-50">{stats.totalSets}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Sets</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center">
          <div className="text-xl font-bold tabular-nums text-neutral-50">
            {effort != null ? `${effort}%` : '—'}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Effort vs. best</div>
        </div>
      </div>

      {!weightLbs && (
        <p className="mb-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-3 py-2 text-[11px] text-neutral-500">
          Log your weight in Health to see calories burned here.
        </p>
      )}

      {stats.muscleGroups.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {[...stats.muscleGroups.entries()].map(([group, count]) => {
            const style = muscleGroupStyle(group)
            return (
              <span
                key={group}
                className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-300"
              >
                <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} />
                {group}
                {count > 1 && <span className="text-neutral-600">×{count}</span>}
              </span>
            )
          })}
        </div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Today's lifts</p>
      <div className="space-y-1.5">
        {rowGroups.map((group) => (
          <LiftRowGroup
            key={group.key}
            rows={group.rows}
            renderRow={(row) => {
              const style = muscleGroupStyle(row.info?.muscleGroup)
              return (
                <div
                  className={clsx(
                    'rounded-lg border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 bg-neutral-900 p-2.5',
                    style.border,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-100">
                        {row.info?.name ?? row.entry.exerciseName}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {setsSummary(row.entry, row.isCardio) || 'no sets logged'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {!row.isCardio && row.volume > 0 && (
                        <p className="text-xs font-semibold tabular-nums text-neutral-300">
                          {row.volume.toLocaleString()} lb
                        </p>
                      )}
                      {!row.isCardio &&
                        row.todayBest > 0 &&
                        (row.historicalBest <= 0 ? (
                          <p className="text-[10px] text-neutral-600">first time logged</p>
                        ) : row.todayBest >= row.historicalBest ? (
                          <p className="text-[10px] font-semibold text-amber-400">★ new best</p>
                        ) : (
                          <p className="text-[10px] text-neutral-600">
                            {Math.round((row.todayBest / row.historicalBest) * 100)}% of best
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ===================== SCOREBOARD ===================== */

function ScoreboardView({
  session,
  stats,
  rowGroups,
  durationSeconds,
  calories,
  effort,
  topLift,
}: {
  session: WorkoutSession
  stats: Stats
  rowGroups: { key: string; rows: Stats['exerciseRows'] }[]
  durationSeconds: number | null
  calories: number | null
  effort: number | null
  topLift: Stats['exerciseRows'][number] | null
}) {
  return (
    <div className="-mx-4 rounded-none bg-[#14161c] px-4 pb-6 pt-5 sm:mx-0 sm:rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#767c92]">
          {format(parseISO(session.date), 'EEE · MMM d')}
        </span>
        {session.endedAt && (
          <span className="rounded bg-[#ff5c6a] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#14161c]">
            Finished
          </span>
        )}
      </div>

      <div className="my-4 text-center">
        <div
          className="font-black leading-none tracking-tight tabular-nums text-[#ff5c6a]"
          style={{ fontFamily: '"Big Shoulders Display", sans-serif', fontSize: 'clamp(3.5rem, 14vw, 5.5rem)' }}
        >
          {stats.totalVolume.toLocaleString()}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#9096ac]">
          Total lbs moved
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-md border-t-2 border-[#ff5c6a] bg-[#1b1e27] px-1 py-2.5 text-center">
          <div
            className={clsx(
              'font-extrabold tabular-nums text-[#eef0f6]',
              durationSeconds == null ? 'text-xs' : 'text-2xl',
            )}
            style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}
          >
            {formatDuration(durationSeconds)}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#767c92]">Time</div>
        </div>
        <div className="rounded-md border-t-2 border-[#ff5c6a] bg-[#1b1e27] px-1 py-2.5 text-center">
          <div className="text-2xl font-extrabold tabular-nums text-[#eef0f6]" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{stats.totalSets}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#767c92]">Sets</div>
        </div>
        <div className="rounded-md border-t-2 border-[#ff5c6a] bg-[#1b1e27] px-1 py-2.5 text-center">
          <div className="text-2xl font-extrabold tabular-nums text-[#eef0f6]" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
            {calories != null ? `~${calories}` : effort != null ? `${effort}%` : stats.exerciseRows.length}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#767c92]">
            {calories != null ? 'Calories' : effort != null ? 'Effort' : 'Lifts'}
          </div>
        </div>
      </div>

      {topLift && (
        <div className="relative mb-4 overflow-hidden rounded-lg border border-[#2a2d3a] bg-gradient-to-br from-[#1e212b] to-[#171922] p-3">
          <span className="absolute right-[-1.7rem] top-2 rotate-[35deg] bg-[#ff5c6a] px-7 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#14161c]">
            Top lift
          </span>
          <div className="text-sm font-bold text-[#eef0f6]">
            {topLift.info?.name ?? topLift.entry.exerciseName}
          </div>
          <div className="mt-0.5 font-mono text-xs text-[#b7bcd0]">
            {setsSummary(topLift.entry, false).split(' ').pop()}
          </div>
          <div className="mt-1 text-[10px] text-[#767c92]">~{Math.round(topLift.todayBest)} lb estimated 1RM</div>
        </div>
      )}

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#767c92]">Scoreline</p>
      <div className="mb-4 space-y-1 overflow-hidden rounded-lg">
        {rowGroups.map((group) => (
          <LiftRowGroup
            key={group.key}
            rows={group.rows}
            renderRow={(row) => (
              <div className="flex items-center justify-between gap-2 bg-[#1b1e27] px-2.5 py-2 text-[11.5px]">
                <span className="min-w-0 truncate font-medium text-[#dfe2ee]">
                  {row.info?.name ?? row.entry.exerciseName}
                  <span className="ml-1.5 text-[9.5px] font-normal text-[#767c92]">{row.info?.muscleGroup}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono tabular-nums text-[#cdd1e0]">
                  {row.isCardio ? setsSummary(row.entry, true) : `${row.volume.toLocaleString()} lb`}
                </span>
              </div>
            )}
          />
        ))}
      </div>

      {stats.muscleGroups.size > 0 && (
        <>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#767c92]">Muscles hit</p>
          <div className="flex flex-wrap gap-1.5">
            {[...stats.muscleGroups.entries()].map(([group, count]) => (
              <span
                key={group}
                className="rounded border border-[#2a2d3a] bg-[#1b1e27] px-2 py-1 font-mono text-[10px] text-[#cdd1e0]"
              >
                <b className="text-[#ff5c6a]">{count}×</b> {group}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
