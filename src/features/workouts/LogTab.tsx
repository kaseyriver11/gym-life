import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { addDays, format, parseISO } from 'date-fns'
import {
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Clock,
  Dumbbell,
  Flame,
  GripVertical,
  History,
  Link2,
  ListPlus,
  MoreVertical,
  MoveDown,
  MoveUp,
  NotebookPen,
  NotebookText,
  Pencil,
  PersonStanding,
  Play,
  Plus,
  Repeat,
  Save,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import { useHealthSnapshots } from '@/features/health/use-health'
import { useProfile } from '@/features/health/use-profile'
import type { MuscleTarget, UserProfile, WorkoutExerciseEntry, WorkoutSession, WorkoutSet, WorkoutTemplate } from '@/types'
import { estimateHoldCalories, estimateSessionCalories } from './calories'
import { HealthImportBanner } from '@/features/health/HealthImport'
import { CardioSetRow } from './CardioSetRow'
import { ComposeWorkoutModal } from './ComposeWorkoutModal'
import { ExerciseFocusModal } from './ExerciseFocusModal'
import { isDurationBased, isHoldBased, muscleGroupStyle, type HoldGroup } from './muscle-groups'
import { MuscleMapModal } from './MuscleMapModal'
import { buildMuscleData } from './muscle-heat'
import { PlateCalcModal } from './PlateCalcModal'
import { bestEstimatedOneRepMax, estimatedOneRepMax } from './prs'
import {
  applySetsOverride,
  applyUnilateralSplit,
  suggestDefaultRpe,
  suggestSets,
  weightIncrement,
  type SuggestedSet,
} from './progression'
import { RestTimerBar } from './RestTimerBar'
import { effectiveDurationSeconds } from './session-time'
import { SequencePlayerBar } from './SequencePlayerBar'
import { SetRow } from './SetRow'
import { useAllExercises } from './use-all-exercises'
import { formatTime, useRestTimer, type RestTimer } from './use-rest-timer'
import { useSequenceTimer, type SequenceStep } from './use-sequence-timer'
import { countSets, isSetLogged, sessionSetProgress, useWorkoutSessions } from './use-workout-sessions'
import { useWorkoutTemplates } from './use-workout-templates'
import { WarmupCalcModal } from './WarmupCalcModal'
import { WorkoutHistoryModal } from './WorkoutHistoryModal'
import { PostWorkoutSummaryModal } from './PostWorkoutSummaryModal'

type ExerciseInfo = {
  id: string
  name: string
  muscleGroup?: string
  muscleSubgroup?: string
  equipment?: string
  repRangeLow?: number
  repRangeHigh?: number
  notes?: string
  /** Quick reminders (one per line) shown directly on the exercise card —
   * distinct from the longer free-form notes, which stay in the focus modal. */
  cues?: string
  formCues?: string[]
  targetMuscles?: MuscleTarget[]
  source?: 'catalog' | 'custom'
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** A drag-to-reorder row — a grip handle beside whatever content it wraps
 * (a whole named block, or one ad hoc exercise/superset), so the same
 * component works at either granularity without knowing which it's given. */
function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    // Absolutely-positioned handle instead of a flex sibling — a fixed-width
    // grip column here used to eat into the card's own content width on
    // every row, which is exactly what broke narrow phones (fixed-width
    // reps/weight steppers no longer fit, pushing the "..." menu button
    // off-screen with no way back to it). This way the card renders at its
    // full original width regardless; the handle just floats over its top
    // corner, straddling the page gutter and the card's own edge.
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('relative', isDragging && 'z-10 opacity-60')}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-2 z-10 flex h-7 w-7 -translate-x-1/2 touch-none items-center justify-center rounded-full bg-neutral-950/80 text-neutral-500 hover:text-neutral-300"
        aria-label="Drag to reorder"
      >
        <GripVertical size={13} />
      </button>
      {children}
    </div>
  )
}

/** Enter/Done on a numeric keypad should dismiss the field like a real form,
 * not leave the user to tap elsewhere to close the keyboard. */
function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') e.currentTarget.blur()
}

/** A left/right pair (added via "+ Add L/R") shares one set number instead
 * of counting as two separate sets — e.g. set 3 becomes "3L"/"3R" rather
 * than bumping every set after it up by one. */
function computeSetNumbers(sets: WorkoutSet[]): number[] {
  const numbers: number[] = []
  let n = 0
  let i = 0
  while (i < sets.length) {
    if (sets[i].side === 'left' && sets[i + 1]?.side === 'right') {
      n += 1
      numbers[i] = n
      numbers[i + 1] = n
      i += 2
    } else {
      n += 1
      numbers[i] = n
      i += 1
    }
  }
  return numbers
}

/** `set.weight || ''` (and the same for reps) reads a genuinely-entered 0 as
 * "nothing typed" and blanks the field right back out — the exact bug behind
 * "I can't enter 0 pounds" on a bodyweight-only machine. Once either field
 * on the set carries a real number, show both as-is (including a literal
 * 0) instead of guessing at "empty" from a falsy value. */
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString()
  const ss = seconds.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function WorkoutTimerBar({
  session,
  onToggle,
  onClearDuration,
  onEnableTimer,
  onSetDuration,
  onViewSummary,
  exercisesById,
  weightLbs,
  profile,
}: {
  session: WorkoutSession
  onToggle: () => void
  /** Clears whatever duration source is active (live clock or a manual
   * entry) without touching any logged sets — back to "nothing timed yet." */
  onClearDuration: () => void
  /** Turns the live clock on, starting from now rather than resuming a
   * stale elapsed time — for the "nothing timed yet" state only. */
  onEnableTimer: () => void
  /** Sets a hand-entered duration, taking priority over the live clock. */
  onSetDuration: (seconds: number) => void
  /** Set only once the workout is finished — reopens the post-workout
   * summary to look back at it. Undefined while still in progress. */
  onViewSummary?: () => void
  exercisesById: Map<string, { muscleGroup?: string; name: string }>
  /** Most recent logged body weight, if any — the calorie estimate needs a
   * weight to work with and silently skips itself without one. */
  weightLbs: number | undefined
  /** Optional age/height/sex to personalize the calorie estimate — see
   * calories.ts. Missing/incomplete falls back to a plain weight estimate. */
  profile?: UserProfile
}) {
  const [now, setNow] = useState(() => Date.now())
  const [confirmClear, setConfirmClear] = useState(false)
  const [editingDuration, setEditingDuration] = useState(false)
  const [draftMinutes, setDraftMinutes] = useState('')
  const [draftSeconds, setDraftSeconds] = useState('')
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    }
  }, [])

  function requestClear() {
    if (confirmClear) {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      onClearDuration()
      return
    }
    setConfirmClear(true)
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    confirmTimeout.current = setTimeout(() => setConfirmClear(false), 2500)
  }

  useEffect(() => {
    if (session.endedAt || session.noTimer || session.durationOverrideSeconds != null) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [session.endedAt, session.noTimer, session.durationOverrideSeconds])

  const effectiveSeconds = effectiveDurationSeconds(session, now)

  function openEditor() {
    const base = effectiveSeconds ?? 0
    setDraftMinutes(effectiveSeconds != null ? String(Math.floor(base / 60)) : '')
    setDraftSeconds(effectiveSeconds != null ? String(base % 60).padStart(2, '0') : '')
    setEditingDuration(true)
  }

  function saveDraft() {
    const minutes = Number(draftMinutes) || 0
    const seconds = Number(draftSeconds) || 0
    const total = minutes * 60 + seconds
    if (total > 0) onSetDuration(total)
    setEditingDuration(false)
  }

  if (editingDuration) {
    return (
      <div className="rounded-lg bg-neutral-900 px-3 py-2">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock size={12} /> Workout duration (MM:SS)
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="MM"
              value={draftMinutes}
              onChange={(e) => setDraftMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveDraft()
                if (e.key === 'Escape') setEditingDuration(false)
              }}
              className="w-14 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm tabular-nums text-neutral-50 outline-none focus:border-indigo-500"
            />
            <span className="text-sm font-semibold text-neutral-500">:</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              placeholder="SS"
              value={draftSeconds}
              onChange={(e) => setDraftSeconds(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveDraft()
                if (e.key === 'Escape') setEditingDuration(false)
              }}
              className="w-14 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm tabular-nums text-neutral-50 outline-none focus:border-indigo-500"
            />
          </div>
          <button onClick={saveDraft} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
            Save
          </button>
          <button
            onClick={() => setEditingDuration(false)}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (effectiveSeconds == null) {
    // Deliberately NOT the same boxed bar as the timed version — with no
    // duration to show, this should read as "nothing here yet," not "the
    // same widget with a blank space where the clock was."
    return (
      <div className="flex items-center justify-between px-0.5 py-1">
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          {session.endedAt && onViewSummary && (
            <button onClick={onViewSummary} className="hover:text-indigo-400 hover:underline">
              View summary
            </button>
          )}
          <button onClick={onEnableTimer} className="flex items-center gap-1.5 hover:text-teal-400">
            <Clock size={13} /> Track time
          </button>
          <button onClick={openEditor} className="flex items-center gap-1.5 hover:text-teal-400">
            <Pencil size={11} /> Enter time
          </button>
        </div>
        <button onClick={onToggle} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
          {session.endedAt ? 'Reopen' : 'Finish workout'}
        </button>
      </div>
    )
  }

  const calories =
    weightLbs && session.entries.length > 0
      ? estimateSessionCalories(session, exercisesById, weightLbs, profile)
      : null
  const isManual = session.durationOverrideSeconds != null

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2">
      <span className="flex items-center gap-1.5 text-xs tabular-nums text-neutral-400">
        <Clock size={13} />
        {formatDuration(effectiveSeconds)}
        {isManual && (
          <span className="text-neutral-600" title="Manually entered, not tracked live">
            *
          </span>
        )}
        {session.endedAt &&
          (onViewSummary ? (
            <button onClick={onViewSummary} className="text-neutral-500 underline-offset-2 hover:text-indigo-400 hover:underline">
              &nbsp;· finished
            </button>
          ) : (
            <span className="text-neutral-600">&nbsp;· finished</span>
          ))}
        {calories != null && calories > 0 && (
          <span
            className="text-neutral-600"
            title="Rough estimate from MET values, your weight, and time — not a precise measurement. Covers everything logged today, cardio and lifting combined."
          >
            &nbsp;· ~{calories} cal today
          </span>
        )}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={openEditor}
          className="text-neutral-500 hover:text-neutral-300"
          aria-label="Edit duration"
          title="Enter this workout's duration by hand"
        >
          <Pencil size={13} />
        </button>
        <button onClick={onToggle} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
          {session.endedAt ? 'Reopen' : 'Finish workout'}
        </button>
        {confirmClear ? (
          <button
            onClick={requestClear}
            className="text-xs font-medium text-red-400 hover:text-red-300"
          >
            Confirm remove timer?
          </button>
        ) : (
          <button
            onClick={requestClear}
            className="text-neutral-500 hover:text-red-400"
            aria-label="Remove timer"
            title="Remove timer — stop tracking time for this workout without deleting it"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export function LogTab({
  autoOpen,
}: {
  /** Set by the home page's "Compose a workout" / "Log one exercise"
   * shortcuts so they actually do something on arrival here, instead of
   * just switching tabs and leaving the user to find the buttons again.
   * Only applies when today has no session yet — if one's already in
   * progress the normal "Add another exercise" flow inside it covers this. */
  autoOpen?: 'compose' | 'quickLog'
}) {
  const [date, setDate] = useState(todayISO())
  const { items: sessions, loading: sessionsLoading, add, update, remove } = useWorkoutSessions()
  const { items: exercises, add: addExercise, saveNote } = useAllExercises()
  const { items: healthSnapshots } = useHealthSnapshots()
  const { profile } = useProfile()
  const session = sessions.find((s) => s.date === date)
  const exercisesById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])
  const latestWeightLbs = useMemo(() => {
    const withWeight = [...healthSnapshots]
      .filter((s) => s.weightLbs != null)
      .sort((a, b) => b.date.localeCompare(a.date))
    return withWeight[0]?.weightLbs
  }, [healthSnapshots])
  const { items: templates, add: addTemplate } = useWorkoutTemplates()
  const [composing, setComposing] = useState(false)
  const [quickLogging, setQuickLogging] = useState(false)
  const [quickCardio, setQuickCardio] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const timer = useRestTimer()

  const autoOpenedRef = useRef(false)
  useEffect(() => {
    // Firestore's session data hasn't necessarily loaded yet on first
    // render — `session` would read as undefined even on a day that
    // actually already has one, so wait for loading to settle before
    // deciding whether to auto-open (and only ever act once).
    if (!autoOpen || sessionsLoading || autoOpenedRef.current) return
    autoOpenedRef.current = true
    if (session) return
    if (autoOpen === 'compose') setComposing(true)
    else setQuickLogging(true)
  }, [autoOpen, sessionsLoading, session])

  function createSession(selected: ExerciseInfo[], setsCount?: number, templateName?: string) {
    const now = Date.now()
    // Only a named, saved-as-you-go composition collapses into its own
    // block — an ad hoc "Compose a workout" selection with no name given
    // stays flat, same as adding exercises one at a time.
    const blockId = templateName ? String(now) : undefined
    const entries = selected.map((ex) => {
      const suggested = suggestSets(sessions, ex.id, ex)
      const sets = isDurationBased(ex.muscleGroup) ? suggested : applySetsOverride(suggested, setsCount)
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: sets.map((s) => ({
          ...s,
          completed: false,
          isEstimate: s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
        })),
        ...(blockId ? { blockId, blockTitle: templateName } : {}),
      }
    })
    add({ date, entries, createdAt: now, updatedAt: now })
    if (templateName) {
      addTemplate({
        name: templateName,
        entries: selected.map((ex) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          plannedSets: (isDurationBased(ex.muscleGroup)
            ? suggestSets(sessions, ex.id, ex)
            : applySetsOverride(suggestSets(sessions, ex.id, ex), setsCount)
          ).map((s) => ({
            reps: s.reps,
            weight: s.weight,
            ...(s.durationSeconds ? { durationSeconds: s.durationSeconds } : {}),
          })),
        })),
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  /** Brings a saved workout's exercises into whatever date is currently
   * selected here — deliberately NOT the same as Plan's "Start" (which
   * always targets today, for "begin this right now"). This is for the
   * clearly different case of planning ahead into a future date. */
  function importTemplate(template: WorkoutTemplate) {
    const now = Date.now()
    const blockId = String(now)
    const newEntries = template.entries.map((entry) => {
      const hasRealPlan = entry.plannedSets.some(
        (s) => s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
      )
      const exerciseInfo = exercises.find((ex) => ex.id === entry.exerciseId)
      const sets = applyUnilateralSplit(
        hasRealPlan ? entry.plannedSets : suggestSets(sessions, entry.exerciseId, exerciseInfo),
        entry.exerciseName,
        exerciseInfo?.perSide,
      )
      return {
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        sets: sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          ...('side' in s ? { side: s.side } : {}),
          ...('durationSeconds' in s ? { durationSeconds: s.durationSeconds } : {}),
          ...('restAfterSeconds' in s ? { restAfterSeconds: s.restAfterSeconds } : {}),
          completed: false,
          isEstimate: s.reps > 0 || s.weight > 0 || (('durationSeconds' in s ? s.durationSeconds : 0) ?? 0) > 0,
        })),
        blockId,
        blockTitle: template.name,
        templateId: template.id,
      }
    })
    // Whatever's already logged for this date (a cardio entry started from
    // the quick-add flow, most commonly) has to be merged into rather than
    // forked into a second same-day session the day view can never show
    // alongside the first — same fix as Plan's "Start".
    if (session) {
      update(session.id, { entries: [...session.entries, ...newEntries], updatedAt: now })
    } else {
      add({ date, entries: newEntries, createdAt: now, updatedAt: now })
    }
    setImporting(false)
  }

  const timerBar = session && (
    <WorkoutTimerBar
      session={session}
      onToggle={() => {
        const finishing = !session.endedAt
        update(session.id, { endedAt: session.endedAt ? undefined : Date.now() })
        if (finishing) setShowSummary(true)
      }}
      onClearDuration={() => update(session.id, { noTimer: true, durationOverrideSeconds: undefined })}
      onEnableTimer={() => update(session.id, { noTimer: false, durationOverrideSeconds: undefined, createdAt: Date.now() })}
      onSetDuration={(seconds) => update(session.id, { durationOverrideSeconds: seconds })}
      onViewSummary={session.endedAt ? () => setShowSummary(true) : undefined}
      exercisesById={exercisesById}
      weightLbs={latestWeightLbs}
      profile={profile}
    />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-medium text-neutral-50">
            {format(parseISO(date), 'EEEE, MMM d')}
          </p>
          <button
            onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900"
          aria-label="Workout history"
        >
          <History size={18} />
        </button>
      </div>

      <HealthImportBanner />

      {session && <RestTimerBar timer={timer} />}

      {showSummary && session && (
        <PostWorkoutSummaryModal
          session={session}
          sessions={sessions}
          exercisesById={exercisesById}
          weightLbs={latestWeightLbs}
          profile={profile}
          onClose={() => setShowSummary(false)}
        />
      )}

      {!session ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setComposing(true)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-5 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            >
              <ListPlus size={18} />
              <span className="text-center text-xs font-medium">Compose a workout</span>
            </button>
            <button
              onClick={() => setImporting(true)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-5 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            >
              <NotebookText size={18} />
              <span className="text-center text-xs font-medium">Import a saved workout</span>
            </button>
            <button
              onClick={() => setQuickLogging(true)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-5 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            >
              <Dumbbell size={18} />
              <span className="text-center text-xs font-medium">Log an exercise</span>
            </button>
          </div>
          <button
            onClick={() => setQuickCardio(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-3 text-orange-400/80 hover:border-orange-500 hover:text-orange-400"
          >
            <Flame size={16} />
            <span className="text-xs font-medium">Add cardio</span>
          </button>
        </div>
      ) : (
        <SessionEditor
          session={session}
          sessions={sessions}
          exercises={exercises}
          onSave={(entries) => update(session.id, { entries, updatedAt: Date.now() })}
          timer={timer}
          onCreateExercise={addExercise}
          onSaveNote={saveNote}
          suggestSetsFor={(exerciseId, exercise) => suggestSets(sessions, exerciseId, exercise)}
          weightLbs={latestWeightLbs}
          profile={profile}
          timerBar={timerBar}
          templates={templates}
          onImportTemplate={importTemplate}
        />
      )}

      {composing && (
        <ComposeWorkoutModal
          title="Compose your workout"
          confirmLabel={(n) => `Start workout · ${plural(n, 'exercise')}`}
          exercises={exercises}
          excludeIds={new Set()}
          offerSaveAsTemplate
          onClose={() => setComposing(false)}
          onCreateExercise={addExercise}
          onConfirm={(selected, setsCount, templateName) => {
            createSession(selected, setsCount, templateName)
            setComposing(false)
          }}
        />
      )}

      {importing && (
        <ImportTemplateModal
          templates={templates}
          onClose={() => setImporting(false)}
          onImport={importTemplate}
        />
      )}

      {quickLogging && (
        <ComposeWorkoutModal
          title="Log an exercise"
          confirmLabel={(n) => (n <= 1 ? 'Log it' : `Log ${n} exercises`)}
          exercises={exercises}
          excludeIds={new Set()}
          onClose={() => setQuickLogging(false)}
          onCreateExercise={addExercise}
          onConfirm={(selected, setsCount) => {
            createSession(selected, setsCount)
            setQuickLogging(false)
          }}
        />
      )}

      {quickCardio && (
        <ComposeWorkoutModal
          title="Add cardio"
          confirmLabel={(n) => (n <= 1 ? 'Add it' : `Add ${n} activities`)}
          exercises={exercises}
          excludeIds={new Set()}
          defaultGroupFilter="Cardio"
          onClose={() => setQuickCardio(false)}
          onConfirm={(selected) => {
            createSession(selected)
            setQuickCardio(false)
          }}
        />
      )}

      {showHistory && (
        <WorkoutHistoryModal
          sessions={sessions}
          onSelect={(pickedDate) => {
            setDate(pickedDate)
            setShowHistory(false)
          }}
          onDelete={(id) => remove(id)}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

/** Picks a saved workout to bring into whatever date is currently selected
 * on the Log tab — just imports the exercises, doesn't "start" anything
 * (no navigation, no timer), so it behaves the same whether that date is
 * today or three weeks out. */
function ImportTemplateModal({
  templates,
  onClose,
  onImport,
}: {
  templates: WorkoutTemplate[]
  onClose: () => void
  onImport: (template: WorkoutTemplate) => void
}) {
  return (
    <Modal title="Import a saved workout" onClose={onClose}>
      {templates.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          No saved workouts yet — compose one and check "Also save as a reusable workout", or
          build one from the Plan tab.
        </p>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => onImport(t)}
                className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-left hover:border-indigo-500"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-100">{t.name}</p>
                  <p className="text-xs text-neutral-500">
                    {plural(t.entries.length, 'exercise')}
                  </p>
                </div>
                <Plus size={16} className="shrink-0 text-neutral-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function SessionEditor({
  session,
  sessions,
  exercises,
  onSave,
  timer,
  onCreateExercise,
  onSaveNote,
  suggestSetsFor,
  weightLbs,
  profile,
  timerBar,
  templates,
  onImportTemplate,
}: {
  session: WorkoutSession
  sessions: WorkoutSession[]
  exercises: ExerciseInfo[]
  onSave: (entries: WorkoutExerciseEntry[]) => void
  timer: RestTimer
  onCreateExercise: (data: {
    name: string
    muscleGroup: string
    equipment?: string
    createdAt: number
  }) => Promise<{ id: string }>
  onSaveNote: (
    exerciseId: string,
    data: { notes?: string; cues?: string; targetMuscles?: MuscleTarget[] },
  ) => void
  weightLbs?: number
  /** Optional age/height/sex to personalize the cardio calorie readout —
   * see calories.ts. Missing/incomplete falls back to a plain weight estimate. */
  profile?: UserProfile
  suggestSetsFor: (
    exerciseId: string,
    exercise?: ExerciseInfo,
  ) => SuggestedSet[]
  /** The workout-duration/finish/summary bar — rendered once, always at the
   * very top of the page so it reads unambiguously as the whole day's
   * total rather than looking like it belongs to whichever block it's
   * nearest to. */
  timerBar?: React.ReactNode
  templates: WorkoutTemplate[]
  /** Imports a saved workout's exercises into whatever's already logged
   * today — same merge as "Add another exercise", just from a template. */
  onImportTemplate: (template: WorkoutTemplate) => void
}) {
  const [entries, setEntries] = useState(session.entries)
  const [addingMore, setAddingMore] = useState(false)
  const [addingCardio, setAddingCardio] = useState(false)
  const [importingMore, setImportingMore] = useState(false)
  const [savingAsTemplate, setSavingAsTemplate] = useState(false)
  const { add: addTemplate, update: updateTemplate } = useWorkoutTemplates()
  const [switchEntryIndex, setSwitchEntryIndex] = useState<number | null>(null)
  const [switchTarget, setSwitchTarget] = useState<ExerciseInfo | null>(null)
  const sequenceMapRef = useRef<{ entryIndex: number; setIndex: number }[]>([])
  const sequenceTimer = useSequenceTimer((stepIndex, actualSeconds) => {
    const target = sequenceMapRef.current[stepIndex]
    if (!target) return
    updateSet(target.entryIndex, target.setIndex, {
      durationSeconds: actualSeconds,
      completed: true,
      isEstimate: false,
    })
  })
  const [timingTarget, setTimingTarget] = useState<{ entryIndex: number; setIndex: number } | null>(
    null,
  )
  const [calcWeight, setCalcWeight] = useState<number | null>(null)
  const [warmupWeight, setWarmupWeight] = useState<number | null>(null)
  const [showMuscleMap, setShowMuscleMap] = useState(false)
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<number | null>(null)
  const [confirmDeleteBlockId, setConfirmDeleteBlockId] = useState<string | null>(null)
  const [focusEntryIndex, setFocusEntryIndex] = useState<number | null>(null)
  const [exerciseMenuIndex, setExerciseMenuIndex] = useState<number | null>(null)
  const [setMenuTarget, setSetMenuTarget] = useState<{ entryIndex: number; setIndex: number } | null>(
    null,
  )
  const confirmDeleteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function requestRemoveEntry(index: number) {
    if (confirmDeleteEntry === index) {
      if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
      setConfirmDeleteEntry(null)
      removeEntry(index)
      return
    }
    setConfirmDeleteEntry(index)
    if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
    confirmDeleteTimeout.current = setTimeout(() => setConfirmDeleteEntry(null), 2500)
  }

  /** Deletes every exercise belonging to one specific named block — e.g.
   * one of several identically-titled "Back Day #2" blocks sitting in the
   * same session (from starting the same saved workout more than once) —
   * without touching anything else that day. Targets by blockId, not
   * title, so which one gets removed is unambiguous even though they look
   * identical: it's whichever one you opened the menu on. */
  function deleteBlock(blockId: string) {
    commit(entries.filter((e) => e.blockId !== blockId))
  }

  function requestDeleteBlock(blockId: string) {
    if (confirmDeleteBlockId === blockId) {
      if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
      setConfirmDeleteBlockId(null)
      deleteBlock(blockId)
      return
    }
    setConfirmDeleteBlockId(blockId)
    if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
    confirmDeleteTimeout.current = setTimeout(() => setConfirmDeleteBlockId(null), 2500)
  }
  const exercisesById = useMemo(
    () => new Map(exercises.map((ex) => [ex.id, ex])),
    [exercises],
  )
  const anySetCompleted = useMemo(
    () => entries.some((e) => e.sets.some((s) => s.completed)),
    [entries],
  )
  const groupLabels = useMemo(() => {
    const map = new Map<number, string>()
    for (const entry of entries) {
      if (entry.supersetGroup != null && !map.has(entry.supersetGroup)) {
        map.set(entry.supersetGroup, String.fromCharCode(65 + map.size))
      }
    }
    return map
  }, [entries])
  // Entries sharing a blockId came in together as one named composed/saved
  // workout (e.g. "Back Day #2" started from Plan) — they collapse under one
  // header, separate from cardio or extras added ad hoc into the same day.
  // A named block reunites under its one header even when something ad hoc
  // (like cardio dropped in mid-workout, or unitBounds not yet guarding an
  // older save) landed between its entries — otherwise the same block ends
  // up rendered as several fragments all titled the same thing. Entries with
  // no blockId only group together when actually adjacent (still eligible
  // for their own supersetGroup pairing below).
  const blockGroups = useMemo(() => {
    const blocks: {
      blockId: string | null
      blockTitle?: string
      items: { entry: WorkoutExerciseEntry; index: number }[]
    }[] = []
    const namedBlockIndex = new Map<string, number>()
    entries.forEach((entry, index) => {
      const blockId = entry.blockId ?? null
      if (blockId != null) {
        const existing = namedBlockIndex.get(blockId)
        if (existing != null) {
          blocks[existing].items.push({ entry, index })
          return
        }
        namedBlockIndex.set(blockId, blocks.length)
        blocks.push({ blockId, blockTitle: entry.blockTitle, items: [{ entry, index }] })
        return
      }
      // Ad hoc entries (blockId null) all belong to the same implicit
      // "ungrouped" run together — only a *named* block boundary (a
      // different blockId, or the switch to/from null) should split them,
      // otherwise every single ad hoc entry ends up in its own run and the
      // superset-pairing check inside it never sees a neighbor to match.
      const last = blocks[blocks.length - 1]
      if (last && last.blockId === null) {
        last.items.push({ entry, index })
      } else {
        blocks.push({ blockId: null, items: [{ entry, index }] })
      }
    })
    return blocks
  }, [entries])

  // Named blocks start collapsed — the whole point is to not dump a
  // composed workout's exercises inline. Ad hoc entries (blockId null)
  // never appear here, so they're never collapsed.
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    () => new Set(entries.flatMap((e) => (e.blockId ? [e.blockId] : []))),
  )

  function toggleBlock(id: string) {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** The unit drag-and-drop actually relocates — a named block moves whole
   * (dragging any part of it carries the entire saved workout, and also
   * re-consolidates it into one contiguous run if it was ever fragmented),
   * while an ad hoc run subdivides further into one unit per superset (or
   * lone entry), matching exactly what moveEntry's unitBounds already
   * treats as atomic — so dragging can never split anything move-up/down
   * wouldn't already keep together. */
  type DragUnit =
    | { key: string; kind: 'block'; block: (typeof blockGroups)[number] }
    | { key: string; kind: 'entry'; items: { entry: WorkoutExerciseEntry; index: number }[] }

  const dragUnits: DragUnit[] = []
  blockGroups.forEach((block) => {
    if (block.blockId != null) {
      dragUnits.push({ key: block.blockId, kind: 'block', block })
      return
    }
    let i = 0
    while (i < block.items.length) {
      const groupId = block.items[i].entry.supersetGroup
      let j = i
      if (groupId != null) {
        while (j + 1 < block.items.length && block.items[j + 1].entry.supersetGroup === groupId) j++
      }
      const slice = block.items.slice(i, j + 1)
      dragUnits.push({ key: `entry-${slice[0].index}`, kind: 'entry', items: slice })
      i = j + 1
    }
  })

  function unitIndices(unit: DragUnit): number[] {
    return (unit.kind === 'block' ? unit.block.items : unit.items).map((i) => i.index)
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromUnit = dragUnits.find((u) => u.key === active.id)
    const toUnit = dragUnits.find((u) => u.key === over.id)
    if (!fromUnit || !toUnit) return
    const fromIndices = unitIndices(fromUnit)
    const fromSet = new Set(fromIndices)
    const movingEntries = fromIndices.map((i) => entries[i])
    const rest = entries.filter((_, i) => !fromSet.has(i))
    const toFirstOriginal = Math.min(...unitIndices(toUnit))
    const removedBefore = fromIndices.filter((i) => i < toFirstOriginal).length
    const insertAt = toFirstOriginal - removedBefore
    commit([...rest.slice(0, insertAt), ...movingEntries, ...rest.slice(insertAt)])
  }

  /** Consecutive entries sharing a supersetGroup render inside one
   * bracketed wrapper instead of each carrying its own inline "Superset A"
   * badge — shared by the top-level list and the inside of an expanded
   * named block, since a composed workout can itself contain supersets. */
  function renderEntryItems(items: { entry: WorkoutExerciseEntry; index: number }[]) {
    const groups: { key: string; items: typeof items }[] = []
    items.forEach(({ entry, index }) => {
      const last = groups[groups.length - 1]
      const lastItem = last?.items[last.items.length - 1]
      if (
        entry.supersetGroup != null &&
        lastItem &&
        lastItem.entry.supersetGroup === entry.supersetGroup
      ) {
        last.items.push({ entry, index })
      } else {
        groups.push({ key: `${entry.exerciseId}-${index}`, items: [{ entry, index }] })
      }
    })
    return groups.map((group) =>
      group.items.length > 1 ? (
        <div
          key={group.key}
          className="rounded-xl border-l-4 border-neutral-100/80 bg-white/[0.03] py-1.5 pl-3 pr-1.5"
        >
          {group.items.map(({ entry, index }, i) => (
            <div key={index}>
              {renderCard(entry, index)}
              {i < group.items.length - 1 && (
                <div
                  className="my-1.5 h-px w-full opacity-40"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to right, white 0, white 5px, transparent 5px, transparent 10px)',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        renderCard(group.items[0].entry, group.items[0].index)
      ),
    )
  }

  // Reset local edit buffer when switching to a different session/day.
  useEffect(() => {
    setEntries(session.entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  useEffect(() => {
    return () => {
      if (confirmDeleteTimeout.current) clearTimeout(confirmDeleteTimeout.current)
    }
  }, [])

  function commit(next: WorkoutExerciseEntry[]) {
    setEntries(next)
    onSave(next)
  }

  function removeEntry(index: number) {
    const groupId = entries[index].supersetGroup
    commit(clearOrphanedGroup(entries.filter((_, i) => i !== index), groupId))
  }

  /** The atomic unit move-up/move-down/move-to-top relocates as a whole.
   * A named block (a saved workout started/imported together, e.g. "Back
   * Day #1") always wins over supersets, since a superset can live inside a
   * block and must not be split out of it. Without a blockId, a superset is
   * the unit; a lone entry is its own unit. This must stay in sync with
   * blockGroups' notion of what belongs together — otherwise moving an
   * unrelated entry (like cardio added ad hoc) one step at a time walks it
   * straight through the middle of a block instead of jumping over it whole,
   * shredding the block into multiple fragments that all render under the
   * same title. */
  function unitBounds(index: number) {
    const entry = entries[index]
    let start = index
    let end = index
    if (entry.blockId != null) {
      while (start > 0 && entries[start - 1].blockId === entry.blockId) start--
      while (end < entries.length - 1 && entries[end + 1].blockId === entry.blockId) end++
    } else if (entry.supersetGroup != null) {
      while (
        start > 0 &&
        entries[start - 1].supersetGroup === entry.supersetGroup &&
        entries[start - 1].blockId == null
      )
        start--
      while (
        end < entries.length - 1 &&
        entries[end + 1].supersetGroup === entry.supersetGroup &&
        entries[end + 1].blockId == null
      )
        end++
    }
    return { start, end }
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const { start: blockStart, end: blockEnd } = unitBounds(index)
    const movingBlock = entries.slice(blockStart, blockEnd + 1)

    if (direction === -1) {
      if (blockStart === 0) return
      const { start: neighborStart } = unitBounds(blockStart - 1)
      commit([
        ...entries.slice(0, neighborStart),
        ...movingBlock,
        ...entries.slice(neighborStart, blockStart),
        ...entries.slice(blockEnd + 1),
      ])
    } else {
      if (blockEnd === entries.length - 1) return
      const { end: neighborEnd } = unitBounds(blockEnd + 1)
      commit([
        ...entries.slice(0, blockStart),
        ...entries.slice(blockEnd + 1, neighborEnd + 1),
        ...movingBlock,
        ...entries.slice(neighborEnd + 1),
      ])
    }
  }

  /** Jumps a whole unit straight to the top of the list — the
   * one-step-at-a-time moveEntry above needs a click per position, which
   * gets tedious from the bottom of a long workout. */
  function moveEntryToTop(index: number) {
    const { start: blockStart, end: blockEnd } = unitBounds(index)
    if (blockStart === 0) return
    const movingBlock = entries.slice(blockStart, blockEnd + 1)
    commit([...movingBlock, ...entries.slice(0, blockStart), ...entries.slice(blockEnd + 1)])
  }

  /** Replaces one entry's exercise in place, keeping its position/blockId/
   * supersetGroup — only the exercise identity and its sets change. Sets
   * reset to a fresh suggestion for the new exercise since the old numbers
   * (reps/weight or hold/rest) were tuned for a different movement.
   * `permanent` also rewrites the source template so every future start of
   * it picks up the new exercise — only offered when the entry actually
   * came from one (see WorkoutExerciseEntry.templateId). */
  function switchExercise(entryIndex: number, next: ExerciseInfo, permanent: boolean) {
    const entry = entries[entryIndex]
    const newSets = suggestSetsFor(next.id, next).map((s) => ({
      ...s,
      completed: false,
      isEstimate: s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
    }))
    commit(
      entries.map((e, i) =>
        i === entryIndex ? { ...e, exerciseId: next.id, exerciseName: next.name, sets: newSets } : e,
      ),
    )
    if (permanent && entry.templateId) {
      const template = templates.find((t) => t.id === entry.templateId)
      if (template) {
        updateTemplate(template.id, {
          entries: template.entries.map((te) =>
            te.exerciseId === entry.exerciseId
              ? { exerciseId: next.id, exerciseName: next.name, plannedSets: [{ reps: 0, weight: 0 }] }
              : te,
          ),
          updatedAt: Date.now(),
        })
      }
    }
  }

  function linkWithNext(entryIndex: number) {
    const a = entries[entryIndex]
    const b = entries[entryIndex + 1]
    if (!b) return
    const groupId =
      a.supersetGroup ??
      b.supersetGroup ??
      1 + Math.max(0, ...entries.map((e) => e.supersetGroup ?? 0))
    const next = entries.map((e, i) =>
      i === entryIndex || i === entryIndex + 1 ? { ...e, supersetGroup: groupId } : e,
    )
    commit(next)
  }

  function unlinkFromGroup(entryIndex: number) {
    const groupId = entries[entryIndex].supersetGroup
    const next = entries.map((e, i) =>
      i === entryIndex ? { ...e, supersetGroup: undefined } : e,
    )
    commit(clearOrphanedGroup(next, groupId))
  }

  /** A superset of one exercise isn't a superset — clear the tag off
   * whichever entry is left once its partner is removed or unlinked. */
  function clearOrphanedGroup(list: WorkoutExerciseEntry[], groupId?: number) {
    if (groupId == null) return list
    const remaining = list.filter((e) => e.supersetGroup === groupId)
    if (remaining.length !== 1) return list
    return list.map((e) => (e.supersetGroup === groupId ? { ...e, supersetGroup: undefined } : e))
  }

  /** Rest only auto-starts after the last exercise in a superset chain —
   * exercises outside any superset always count as "last". */
  function isLastInGroup(entryIndex: number): boolean {
    const groupId = entries[entryIndex].supersetGroup
    if (groupId == null) return true
    const indices = entries.reduce<number[]>(
      (acc, e, i) => (e.supersetGroup === groupId ? [...acc, i] : acc),
      [],
    )
    return entryIndex === Math.max(...indices)
  }

  /** Marks a strength set done (or undoes that) — shared by the set-options
   * menu and, while it still existed, the row's own toggle button. Moved
   * out of the row entirely (into the "..." menu) since it was one of the
   * fixed-width elements that no longer fit on a real phone screen
   * alongside the reps/weight steppers. */
  function toggleSetComplete(entryIndex: number, setIndex: number) {
    const entry = entries[entryIndex]
    const set = entry.sets[setIndex]
    const info = exercisesById.get(entry.exerciseId)
    const nowCompleted = !set.completed
    const patch: Partial<WorkoutSet> = {
      completed: nowCompleted,
      isEstimate: false,
    }
    if (nowCompleted && set.rpe == null) {
      const priorReps = entry.sets
        .slice(0, setIndex)
        .filter((s) => s.completed)
        .map((s) => s.reps)
      patch.rpe = suggestDefaultRpe(set.reps, priorReps, info?.repRangeLow, info?.repRangeHigh)
    }
    updateSet(entryIndex, setIndex, patch)
    if (nowCompleted && isLastInGroup(entryIndex)) timer.start()
  }

  function focusById(id: string) {
    const el = document.getElementById(id)
    if (el instanceof HTMLInputElement) {
      el.focus()
      el.select()
    }
  }

  /** Enter on reps jumps straight to that same set's weight field. Also
   * confirms the set's current numbers — highlighting the suggested reps and
   * pressing Enter is how you accept it as-is, so the greyed "still just a
   * suggestion" styling should clear right along with moving on, not stay
   * grey until some unrelated edit happens to touch the flag. */
  function handleRepsEnter(
    e: React.KeyboardEvent<HTMLInputElement>,
    entryIndex: number,
    setIndex: number,
  ) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (entries[entryIndex]?.sets[setIndex]?.isEstimate) {
      updateSet(entryIndex, setIndex, { isEstimate: false })
    }
    focusById(`weight-${entryIndex}-${setIndex}`)
  }

  /** Enter on weight jumps to the next set's reps field — or the next
   * exercise's first set if this was the last one — instead of landing on
   * whatever happens to be next in tab order (the plate calculator icon).
   * Confirms the set the same way handleRepsEnter does. */
  function handleWeightEnter(
    e: React.KeyboardEvent<HTMLInputElement>,
    entryIndex: number,
    setIndex: number,
  ) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (entries[entryIndex]?.sets[setIndex]?.isEstimate) {
      updateSet(entryIndex, setIndex, { isEstimate: false })
    }
    const currentSets = entries[entryIndex]?.sets ?? []
    if (setIndex + 1 < currentSets.length) {
      focusById(`reps-${entryIndex}-${setIndex + 1}`)
      return
    }
    const nextEntry = entries[entryIndex + 1]
    if (nextEntry && nextEntry.sets.length > 0) {
      focusById(`reps-${entryIndex + 1}-0`)
      return
    }
    e.currentTarget.blur()
  }

  /** A manually-added set beyond what the progression engine suggested
   * carries forward the previous set's reps/weight as a starting point
   * (flagged as an estimate, same as a suggested set) rather than defaulting
   * to blank zeros — otherwise only the first N sets (however many the last
   * logged session had) ever get a recommendation. */
  function addSet(entryIndex: number) {
    const next = entries.map((entry, i) => {
      if (i !== entryIndex) return entry
      const last = entry.sets[entry.sets.length - 1]
      return {
        ...entry,
        sets: [
          ...entry.sets,
          last
            ? {
                reps: last.reps,
                weight: last.weight,
                durationSeconds: last.durationSeconds,
                distanceMiles: last.distanceMiles,
                // Cardio intervals/laps: carry the machine settings forward too.
                intensity: last.intensity,
                incline: last.incline,
                resistance: last.resistance,
                completed: false,
                isEstimate: true,
              }
            : { reps: 0, weight: 0, completed: false },
        ],
      }
    })
    commit(next)
  }

  /** For unilateral exercises — adds a left/right pair instead of one
   * bilateral set, so each side is logged and progressed independently. */
  function addSetPair(entryIndex: number) {
    const next = entries.map((entry, i) => {
      if (i !== entryIndex) return entry
      // Only carry a weight forward from an earlier *per-side* set — the
      // first pair added to an entry that's been logged two-handed has no
      // real basis for guessing a one-arm weight (it isn't just half, or
      // even necessarily different), so leave it blank rather than
      // confidently prefilling the bilateral number.
      const lastSided = [...entry.sets].reverse().find((s) => s.side)
      const base = lastSided
        ? { reps: lastSided.reps, weight: lastSided.weight, isEstimate: true }
        : { reps: 0, weight: 0 }
      return {
        ...entry,
        sets: [
          ...entry.sets,
          { ...base, completed: false, side: 'left' as const },
          { ...base, completed: false, side: 'right' as const },
        ],
      }
    })
    commit(next)
  }

  function updateSet(
    entryIndex: number,
    setIndex: number,
    patch: Partial<WorkoutExerciseEntry['sets'][number]>,
  ) {
    const editedSet = entries[entryIndex]?.sets[setIndex]
    const weightChanged = patch.weight != null && patch.weight !== editedSet?.weight
    const repsChanged = patch.reps != null && patch.reps !== editedSet?.reps
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? {
            ...entry,
            sets: entry.sets.map((set, j) => {
              if (j === setIndex) return { ...set, ...patch }
              // A real weight/reps entry carries forward onto any later
              // sets that are still just a placeholder suggestion —
              // otherwise a heavier (or lighter) working weight than the
              // plan guessed stays invisible to the rest of the exercise,
              // which keeps showing a stale number from last time instead
              // of catching up to what's actually happening today.
              if (j > setIndex && set.isEstimate && (weightChanged || repsChanged)) {
                return {
                  ...set,
                  ...(weightChanged ? { weight: patch.weight } : {}),
                  ...(repsChanged ? { reps: patch.reps } : {}),
                }
              }
              return set
            }),
          }
        : entry,
    )
    commit(next)
  }

  /** Feeds a block's poses into the sequence timer in order — every set of
   * every entry becomes one step, so "hold 3 rounds of Warrior II" (one
   * entry, 3 sets) plays back as 3 separate timed steps just like 3
   * different poses would. Falls back to a 30s hold / 15s rest for any pose
   * that was never given a planned duration, so "Start sequence" always
   * does something reasonable rather than a silent 0-second skip. */
  function startSequence(items: { entry: WorkoutExerciseEntry; index: number }[]) {
    const steps: SequenceStep[] = []
    const map: { entryIndex: number; setIndex: number }[] = []
    items.forEach(({ entry, index }) => {
      entry.sets.forEach((set, setIndex) => {
        steps.push({
          label: set.side
            ? `${entry.exerciseName} — ${set.side === 'left' ? 'Left' : 'Right'}`
            : entry.sets.length > 1
              ? `${entry.exerciseName} (${setIndex + 1})`
              : entry.exerciseName,
          holdSeconds: set.durationSeconds || 30,
          restSeconds: set.restAfterSeconds ?? 15,
        })
        map.push({ entryIndex: index, setIndex })
      })
    })
    if (steps.length === 0) return
    sequenceMapRef.current = map
    sequenceTimer.start(steps)
  }

  function removeSet(entryIndex: number, setIndex: number) {
    const next = entries.map((entry, i) =>
      i === entryIndex
        ? { ...entry, sets: entry.sets.filter((_, j) => j !== setIndex) }
        : entry,
    )
    commit(next)
  }

  function isSetPr(entryIndex: number, setIndex: number): boolean {
    const entry = entries[entryIndex]
    const set = entry.sets[setIndex]
    if (!set.completed) return false
    const candidate = estimatedOneRepMax(set.weight, set.reps)
    if (candidate <= 0) return false
    const historyBest = bestEstimatedOneRepMax(sessions, entry.exerciseId, session.id)
    const todayBest = entry.sets.reduce((max, s, i) => {
      if (i === setIndex || !s.completed) return max
      return Math.max(max, estimatedOneRepMax(s.weight, s.reps))
    }, 0)
    return candidate > Math.max(historyBest, todayBest)
  }

  function renderCard(entry: WorkoutExerciseEntry, entryIndex: number) {
        const info = exercisesById.get(entry.exerciseId)
        const style = muscleGroupStyle(info?.muscleGroup)
        return (
        <div
          key={`${entry.exerciseId}-${entryIndex}`}
          className={clsx(
            'rounded-xl border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 bg-neutral-900 p-3',
            style.border,
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  style.badge,
                )}
              >
                {entryIndex + 1}
              </span>
              <div className="min-w-0">
                <button
                  onClick={() => setFocusEntryIndex(entryIndex)}
                  className="text-left"
                  title="Notes, cues, muscle targets, and history for this exercise"
                >
                  <p className="truncate text-sm font-medium text-neutral-100 hover:text-indigo-300">
                    {entry.exerciseName}
                  </p>
                </button>
                {(info?.muscleGroup || info?.equipment || entry.supersetGroup != null) && (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {info?.muscleGroup && (
                      <span className={clsx('shrink-0 text-[11px] font-medium', style.text)}>
                        {info.muscleGroup}
                      </span>
                    )}
                    {info?.equipment && (
                      <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-neutral-500">
                        <Dumbbell size={10} /> {info.equipment}
                      </span>
                    )}
                    {entry.supersetGroup != null && (
                      <button
                        onClick={() => unlinkFromGroup(entryIndex)}
                        className="flex shrink-0 items-center gap-0.5 rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-medium text-teal-300 hover:bg-teal-500/30"
                        title="Unlink from superset"
                      >
                        <Link2 size={9} /> Superset {groupLabels.get(entry.supersetGroup)}
                      </button>
                    )}
                  </div>
                )}
                {info?.cues && (
                  <ul className="mt-1 space-y-0.5">
                    {info.cues
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, i) => (
                        <li key={i} className="flex gap-1.5 text-[11px] leading-tight text-neutral-400">
                          <span className="text-neutral-600">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setExerciseMenuIndex(entryIndex)}
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center hover:text-neutral-200',
                info?.notes || info?.cues || info?.targetMuscles ? 'text-teal-500' : 'text-neutral-600',
              )}
              aria-label="Exercise options"
              title="Notes, cues, warm-up, switch, reorder, remove"
            >
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="space-y-1.5">
            {(() => {
              const setNumbers = computeSetNumbers(entry.sets)
              const isCardio = info?.muscleGroup === 'Cardio'
              const isHold = isHoldBased(info?.muscleGroup)
              const weightStep = weightIncrement(info?.equipment, info?.muscleGroup) || 2.5
              const activeSetIndex = (() => {
                const idx = entry.sets.findIndex((s) => !s.completed)
                return idx === -1 ? entry.sets.length - 1 : idx
              })()
              return entry.sets.map((set, setIndex) => {
                const label = set.side
                  ? `${setNumbers[setIndex]}${set.side === 'left' ? 'L' : 'R'}`
                  : setNumbers[setIndex]

                if (isCardio) {
                  const cardioIsTiming =
                    timingTarget?.entryIndex === entryIndex && timingTarget.setIndex === setIndex
                  return (
                    <CardioSetRow
                      key={setIndex}
                      set={set}
                      label={label}
                      entryIndex={entryIndex}
                      setIndex={setIndex}
                      exerciseName={entry.exerciseName}
                      weightLbs={weightLbs}
                      profile={profile}
                      onChange={(patch) => updateSet(entryIndex, setIndex, patch)}
                      onToggleComplete={() => updateSet(entryIndex, setIndex, { completed: !set.completed })}
                      onMenu={() => setSetMenuTarget({ entryIndex, setIndex })}
                      timingSlot={
                        cardioIsTiming && (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                updateSet(entryIndex, setIndex, { durationSeconds: timer.elapsed, isEstimate: false })
                                setTimingTarget(null)
                                timer.reset()
                              }}
                              className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium tabular-nums text-teal-300"
                            >
                              <Square size={10} /> Stop &amp; save {formatTime(timer.elapsed)}
                            </button>
                            <button
                              onClick={() => {
                                setTimingTarget(null)
                                timer.reset()
                              }}
                              className="text-neutral-600 hover:text-red-400"
                              aria-label="Cancel timing"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        )
                      }
                    />
                  )
                }

                if (isHold) {
                  const holdIsTiming =
                    timingTarget?.entryIndex === entryIndex && timingTarget.setIndex === setIndex
                  return (
                    <div key={setIndex} className="flex flex-wrap items-center gap-2">
                      <span className="w-6 shrink-0 text-xs text-neutral-500">{label}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        id={`reps-${entryIndex}-${setIndex}`}
                        placeholder="hold sec"
                        value={set.durationSeconds || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateSet(entryIndex, setIndex, {
                            durationSeconds: Number(e.target.value) || 0,
                            isEstimate: false,
                          })
                        }
                        className={clsx(
                          `${inputClass} py-1.5`,
                          set.isEstimate && 'text-neutral-500 animate-pulse-slow',
                        )}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        id={`weight-${entryIndex}-${setIndex}`}
                        placeholder="rest sec"
                        value={set.restAfterSeconds || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateSet(entryIndex, setIndex, { restAfterSeconds: Number(e.target.value) || 0 })
                        }
                        className={`${inputClass} py-1.5`}
                      />
                      <button
                        onClick={() => updateSet(entryIndex, setIndex, { completed: !set.completed, isEstimate: false })}
                        className={`h-7 w-7 shrink-0 rounded-full border-2 ${
                          set.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600'
                        }`}
                        aria-label="Set completed"
                      />
                      {holdIsTiming ? (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              updateSet(entryIndex, setIndex, { durationSeconds: timer.elapsed, isEstimate: false })
                              setTimingTarget(null)
                              timer.reset()
                            }}
                            className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium tabular-nums text-teal-300"
                          >
                            <Square size={10} /> {formatTime(timer.elapsed)}
                          </button>
                          <button
                            onClick={() => {
                              setTimingTarget(null)
                              timer.reset()
                            }}
                            className="text-neutral-600 hover:text-red-400"
                            aria-label="Cancel timing"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setTimingTarget({ entryIndex, setIndex })
                            timer.startStopwatch(entry.exerciseName)
                          }}
                          className="text-xs text-teal-400 hover:underline"
                          title="Time this hold live instead of typing a number"
                        >
                          Time it
                        </button>
                      )}
                      {set.durationSeconds ? (
                        <span className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500">
                          ~{estimateHoldCalories(info!.muscleGroup as HoldGroup, set.durationSeconds, weightLbs ?? 180, profile)} cal
                        </span>
                      ) : null}
                      <button
                        onClick={() => setSetMenuTarget({ entryIndex, setIndex })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-600 hover:text-neutral-200"
                        aria-label="Set options"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  )
                }

                const isTiming =
                  timingTarget?.entryIndex === entryIndex && timingTarget.setIndex === setIndex
                return (
                  <SetRow
                    key={setIndex}
                    label={label}
                    isSided={!!set.side}
                    set={set}
                    isActive={setIndex === activeSetIndex}
                    weightStep={weightStep}
                    isPr={isSetPr(entryIndex, setIndex)}
                    isTiming={isTiming}
                    timerElapsed={timer.elapsed}
                    repsId={`reps-${entryIndex}-${setIndex}`}
                    weightId={`weight-${entryIndex}-${setIndex}`}
                    onRepsKeyDown={(e) => handleRepsEnter(e, entryIndex, setIndex)}
                    onWeightKeyDown={(e) => handleWeightEnter(e, entryIndex, setIndex)}
                    onChangeReps={(reps) => updateSet(entryIndex, setIndex, { reps, isEstimate: false })}
                    onChangeWeight={(weight) => updateSet(entryIndex, setIndex, { weight, isEstimate: false })}
                    onStopTiming={() => {
                      updateSet(entryIndex, setIndex, { durationSeconds: timer.elapsed })
                      setTimingTarget(null)
                      timer.reset()
                    }}
                    onCancelTiming={() => {
                      setTimingTarget(null)
                      timer.reset()
                    }}
                    onOpenMenu={() => setSetMenuTarget({ entryIndex, setIndex })}
                  />
                )
              })
            })()}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => addSet(entryIndex)} className="text-xs text-indigo-400 hover:underline">
                {info?.muscleGroup === 'Cardio' ? '+ Add interval / lap' : '+ Add set'}
              </button>
              {info?.muscleGroup !== 'Cardio' && (
                <button
                  onClick={() => addSetPair(entryIndex)}
                  className="text-xs text-teal-400 hover:underline"
                  title="Add a left + right pair for a unilateral exercise"
                >
                  + Add L/R set
                </button>
              )}
            </div>
            {entryIndex < entries.length - 1 &&
              !(
                entry.supersetGroup != null &&
                entry.supersetGroup === entries[entryIndex + 1].supersetGroup
              ) && (
                <button
                  onClick={() => linkWithNext(entryIndex)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-100"
                  title="Link with the next exercise as a superset — rest only starts after both are done"
                >
                  <Link2 size={12} /> Link with next
                </button>
              )}
          </div>
        </div>
        )
  }

  // "Where am I" cue for the whole session — counted by real logged numbers
  // (same "logged" signal the dashboard's own progress pill uses), not the
  // separate completed-toggle, since plenty of real logging here never
  // touches that checkbox. The first exercise with an unlogged set is
  // "current"; once every set everywhere is logged this just reports the
  // last exercise.
  const { totalSets: totalSetCount, loggedSets: completedSetCount } = sessionSetProgress({ entries })
  const currentExerciseIndex = entries.findIndex((e) => e.sets.some((s) => !isSetLogged(s)))
  const currentExercisePosition =
    (currentExerciseIndex === -1 ? entries.length - 1 : currentExerciseIndex) + 1

  return (
    <div className="space-y-3">
      {!session.endedAt && entries.length > 0 && totalSetCount > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400">
            <span>
              Exercise {currentExercisePosition} of {entries.length}
            </span>
            <span className="tabular-nums">
              {completedSetCount}/{totalSetCount} sets
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width]"
              style={{ width: `${(completedSetCount / totalSetCount) * 100}%` }}
            />
          </div>
        </div>
      )}
      {timerBar}
      <SequencePlayerBar timer={sequenceTimer} />
      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={dragUnits.map((u) => u.key)} strategy={verticalListSortingStrategy}>
      {dragUnits.map((unit, unitIndex) => {
        if (unit.kind === 'entry') {
          // A named block and an ad hoc run always alternate in dragUnits
          // (consecutive ad hoc entries are never split across two units),
          // so "starts a new ad hoc run that follows a block" reduces to
          // just checking the immediately preceding unit.
          const showAddedSeparately = unitIndex > 0 && dragUnits[unitIndex - 1].kind === 'block'
          return (
            <SortableRow key={unit.key} id={unit.key}>
              {showAddedSeparately && (
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                  Added separately
                </p>
              )}
              {renderEntryItems(unit.items)}
            </SortableRow>
          )
        }
        const block = unit.block
        const collapsed = collapsedBlocks.has(block.blockId!)
        const totalSets = block.items.reduce((sum, { entry }) => sum + countSets(entry.sets), 0)
        const muscleGroups = [
          ...new Set(
            block.items
              .map(({ entry }) => exercisesById.get(entry.exerciseId)?.muscleGroup)
              .filter((g): g is string => !!g),
          ),
        ]
        const isSequenceBlock = block.items.every(({ entry }) =>
          isHoldBased(exercisesById.get(entry.exerciseId)?.muscleGroup),
        )
        return (
          <SortableRow key={unit.key} id={unit.key}>
          <div className="overflow-hidden rounded-xl border-2 border-indigo-500/40 bg-indigo-500/[0.04]">
            <div className="flex items-stretch gap-1 bg-indigo-500/10">
              <button
                onClick={() => toggleBlock(block.blockId!)}
                className="flex min-w-0 flex-1 items-center gap-2.5 p-3 text-left hover:bg-indigo-500/15"
              >
                {collapsed ? (
                  <ChevronRight size={16} className="shrink-0 text-indigo-400" />
                ) : (
                  <ChevronDown size={16} className="shrink-0 text-indigo-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-100">{block.blockTitle}</p>
                  <p className="truncate text-[11px] text-indigo-300/80">
                    {plural(block.items.length, 'exercise')} · {plural(totalSets, 'set')}
                    {muscleGroups.length > 0 && ` · ${muscleGroups.join(', ')}`}
                  </p>
                </div>
              </button>
              <button
                onClick={() => requestDeleteBlock(block.blockId!)}
                className="flex shrink-0 items-center px-2.5 text-indigo-300/50 hover:text-red-400"
                aria-label={`Delete this "${block.blockTitle}" block`}
                title="Delete just this block — other blocks this day, even ones with the same name, are untouched"
              >
                {confirmDeleteBlockId === block.blockId ? (
                  <span className="whitespace-nowrap text-[11px] font-semibold text-red-400">Confirm?</span>
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </div>
            {isSequenceBlock && (
              <div className="border-t border-indigo-500/20 p-2">
                <button
                  disabled={sequenceTimer.active}
                  onClick={() => startSequence(block.items)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  <Play size={13} /> Start sequence — hands-free timed flow
                </button>
              </div>
            )}
            {!collapsed && (
              <div className="space-y-1.5 p-2 pt-2.5">{renderEntryItems(block.items)}</div>
            )}
          </div>
          </SortableRow>
        )
      })}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <button
          onClick={() => setAddingMore(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
        >
          <ListPlus size={16} /> Add another exercise
        </button>
        <button
          onClick={() => setAddingCardio(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 text-sm text-orange-400/80 hover:border-orange-500 hover:text-orange-400"
          aria-label="Add cardio"
          title="Add cardio — logged as its own activity block, not as sets"
        >
          <Flame size={16} />
        </button>
        {templates.length > 0 && (
          <button
            onClick={() => setImportingMore(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            aria-label="Import a saved workout"
            title="Import a saved workout into today's session"
          >
            <NotebookText size={16} />
          </button>
        )}
        {entries.length > 0 && (
          <button
            onClick={() => setSavingAsTemplate(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
            aria-label="Save as a reusable workout"
            title="Save this workout so you can start it again later"
          >
            <Save size={16} />
          </button>
        )}
        {entries.length > 0 && (
          <button
            onClick={() => setShowMuscleMap(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-4 text-sm text-neutral-400 hover:border-teal-500 hover:text-teal-400"
            aria-label="Muscle map"
            title="Which muscles today's session hits"
          >
            <PersonStanding size={16} />
          </button>
        )}
      </div>

      {importingMore && (
        <ImportTemplateModal
          templates={templates}
          onClose={() => setImportingMore(false)}
          onImport={(template) => {
            onImportTemplate(template)
            setImportingMore(false)
          }}
        />
      )}

      {addingMore && (
        <ComposeWorkoutModal
          title="Add to workout"
          confirmLabel={(n) => `Add ${plural(n, 'exercise')}`}
          exercises={exercises}
          excludeIds={new Set(entries.map((e) => e.exerciseId))}
          onClose={() => setAddingMore(false)}
          onCreateExercise={onCreateExercise}
          onConfirm={(selected, setsCount) => {
            commit([
              ...entries,
              ...selected.map((ex) => {
                const suggested = suggestSetsFor(ex.id, ex)
                const sets = isDurationBased(ex.muscleGroup) ? suggested : applySetsOverride(suggested, setsCount)
                return {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  sets: sets.map((s) => ({
                    ...s,
                    completed: false,
                    isEstimate: s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
                  })),
                }
              }),
            ])
            setAddingMore(false)
          }}
        />
      )}

      {addingCardio && (
        <ComposeWorkoutModal
          title="Add cardio"
          confirmLabel={(n) => (n <= 1 ? 'Add it' : `Add ${n} activities`)}
          exercises={exercises}
          excludeIds={new Set(entries.map((e) => e.exerciseId))}
          defaultGroupFilter="Cardio"
          onClose={() => setAddingCardio(false)}
          onConfirm={(selected) => {
            commit([
              ...entries,
              ...selected.map((ex) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                sets: suggestSetsFor(ex.id, ex).map((s) => ({
                  ...s,
                  completed: false,
                  isEstimate: s.reps > 0 || s.weight > 0 || (s.durationSeconds ?? 0) > 0,
                })),
              })),
            ])
            setAddingCardio(false)
          }}
        />
      )}

      {switchEntryIndex != null && entries[switchEntryIndex] && (
        <ComposeWorkoutModal
          title={`Switch "${entries[switchEntryIndex].exerciseName}"`}
          confirmLabel={() => 'Continue'}
          exercises={exercises}
          excludeIds={new Set([entries[switchEntryIndex].exerciseId])}
          singleSelect
          onClose={() => setSwitchEntryIndex(null)}
          onConfirm={(selected) => {
            const next = selected[0]
            if (!next) return
            // Only offer "change it in the saved workout too" when there's a
            // saved workout of yours to change — not for built-in routines.
            const sourceId = entries[switchEntryIndex].templateId
            if (sourceId && templates.some((t) => t.id === sourceId)) {
              setSwitchTarget(next)
            } else {
              switchExercise(switchEntryIndex, next, false)
              setSwitchEntryIndex(null)
            }
          }}
        />
      )}

      {switchTarget && switchEntryIndex != null && entries[switchEntryIndex] && (
        <Modal title={`Switch to "${switchTarget.name}"`} onClose={() => setSwitchTarget(null)}>
          <div className="space-y-2">
            <p className="text-sm text-neutral-400">
              This exercise came from the saved workout "{entries[switchEntryIndex].blockTitle}". Switch just
              for today, or for that saved workout going forward too?
            </p>
            <button
              onClick={() => {
                switchExercise(switchEntryIndex, switchTarget, false)
                setSwitchTarget(null)
                setSwitchEntryIndex(null)
              }}
              className={primaryButtonClass}
            >
              Just for today
            </button>
            <button
              onClick={() => {
                switchExercise(switchEntryIndex, switchTarget, true)
                setSwitchTarget(null)
                setSwitchEntryIndex(null)
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20"
            >
              Today, and every future "{entries[switchEntryIndex].blockTitle}"
            </button>
          </div>
        </Modal>
      )}

      {calcWeight != null && (
        <PlateCalcModal initialWeight={calcWeight} onClose={() => setCalcWeight(null)} />
      )}

      {warmupWeight != null && (
        <WarmupCalcModal initialWeight={warmupWeight} onClose={() => setWarmupWeight(null)} />
      )}

      {exerciseMenuIndex != null &&
        entries[exerciseMenuIndex] &&
        (() => {
          const idx = exerciseMenuIndex
          const entry = entries[idx]
          const info = exercisesById.get(entry.exerciseId)
          const menuItemClass =
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-30'
          return (
            <Modal title={entry.exerciseName} onClose={() => setExerciseMenuIndex(null)}>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setFocusEntryIndex(idx)
                    setExerciseMenuIndex(null)
                  }}
                  className={menuItemClass}
                >
                  <NotebookPen size={16} /> Notes, cues &amp; muscle info
                </button>
                {!isDurationBased(info?.muscleGroup) && (
                  <button
                    onClick={() => {
                      setWarmupWeight(entry.sets[0]?.weight || 0)
                      setExerciseMenuIndex(null)
                    }}
                    className={menuItemClass}
                  >
                    <Flame size={16} /> Warm-up calculator
                  </button>
                )}
                <button
                  onClick={() => {
                    setSwitchEntryIndex(idx)
                    setExerciseMenuIndex(null)
                  }}
                  className={menuItemClass}
                >
                  <Repeat size={16} /> Switch exercise
                </button>
                <button
                  disabled={idx === 0}
                  onClick={() => {
                    moveEntry(idx, -1)
                    setExerciseMenuIndex(null)
                  }}
                  className={menuItemClass}
                >
                  <MoveUp size={16} /> Move up
                </button>
                {idx > 1 && (
                  <button
                    onClick={() => {
                      moveEntryToTop(idx)
                      setExerciseMenuIndex(null)
                    }}
                    className={menuItemClass}
                  >
                    <ChevronsUp size={16} /> Move to top
                  </button>
                )}
                <button
                  disabled={idx === entries.length - 1}
                  onClick={() => {
                    moveEntry(idx, 1)
                    setExerciseMenuIndex(null)
                  }}
                  className={menuItemClass}
                >
                  <MoveDown size={16} /> Move down
                </button>
                {confirmDeleteEntry === idx ? (
                  <button
                    onClick={() => {
                      requestRemoveEntry(idx)
                      setExerciseMenuIndex(null)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg bg-red-500/20 px-3 py-2.5 text-left text-sm font-semibold text-red-400"
                  >
                    <Trash2 size={16} /> Confirm remove exercise?
                  </button>
                ) : (
                  <button
                    onClick={() => requestRemoveEntry(idx)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} /> Remove exercise
                  </button>
                )}
              </div>
            </Modal>
          )
        })()}

      {setMenuTarget &&
        entries[setMenuTarget.entryIndex]?.sets[setMenuTarget.setIndex] &&
        (() => {
          const { entryIndex, setIndex } = setMenuTarget
          const entry = entries[entryIndex]
          const set = entry.sets[setIndex]
          const info = exercisesById.get(entry.exerciseId)
          const isTiming =
            timingTarget?.entryIndex === entryIndex && timingTarget.setIndex === setIndex
          const setNumber = computeSetNumbers(entry.sets)[setIndex]
          const menuItemClass =
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-30'
          return (
            <Modal
              title={`Set ${setNumber}${set.side ? (set.side === 'left' ? 'L' : 'R') : ''} options`}
              onClose={() => setSetMenuTarget(null)}
            >
              <div className="space-y-1">
                <button
                  onClick={() => {
                    toggleSetComplete(entryIndex, setIndex)
                    setSetMenuTarget(null)
                  }}
                  className={menuItemClass}
                >
                  <span
                    className={clsx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      set.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
                    )}
                  >
                    {set.completed && <Check size={12} strokeWidth={3} />}
                  </span>
                  {set.completed ? 'Mark not done' : 'Mark done'}
                </button>
                {set.completed && info?.muscleGroup !== 'Cardio' && (
                  <label className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-200">
                    <span>RPE — how hard did that feel?</span>
                    <input
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={10}
                      step={0.5}
                      placeholder="–"
                      value={set.rpe ?? ''}
                      onChange={(e) =>
                        updateSet(entryIndex, setIndex, {
                          rpe: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      onKeyDown={blurOnEnter}
                      className="w-14 shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-1 py-1.5 text-center text-sm text-neutral-50 outline-none focus:border-indigo-500"
                    />
                  </label>
                )}
                {!isDurationBased(info?.muscleGroup) &&
                  info?.equipment !== 'Machine' &&
                  info?.equipment !== 'Dumbbell' && (
                    <button
                      onClick={() => {
                        setCalcWeight(set.weight)
                        setSetMenuTarget(null)
                      }}
                      className={menuItemClass}
                    >
                      <Calculator size={16} /> Plate calculator
                    </button>
                  )}
                {isTiming ? (
                  <>
                    <button
                      onClick={() => {
                        updateSet(entryIndex, setIndex, { durationSeconds: timer.elapsed })
                        setTimingTarget(null)
                        timer.reset()
                        setSetMenuTarget(null)
                      }}
                      className={menuItemClass}
                    >
                      <Square size={16} /> Stop &amp; save {formatTime(timer.elapsed)}
                    </button>
                    <button
                      onClick={() => {
                        setTimingTarget(null)
                        timer.reset()
                        setSetMenuTarget(null)
                      }}
                      className={menuItemClass}
                    >
                      <X size={16} /> Cancel timing
                    </button>
                  </>
                ) : (
                  <button
                    disabled={!timer.idle}
                    onClick={() => {
                      setTimingTarget({ entryIndex, setIndex })
                      timer.startStopwatch(entry.exerciseName)
                      setSetMenuTarget(null)
                    }}
                    className={menuItemClass}
                  >
                    <Clock size={16} />{' '}
                    {set.durationSeconds
                      ? `Retime this set (${formatTime(set.durationSeconds)})`
                      : 'Time this set'}
                  </button>
                )}
                {!isTiming && set.durationSeconds ? (
                  <button
                    onClick={() => {
                      updateSet(entryIndex, setIndex, { durationSeconds: undefined })
                      setSetMenuTarget(null)
                    }}
                    className={menuItemClass}
                  >
                    <X size={16} /> Clear time
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    removeSet(entryIndex, setIndex)
                    setSetMenuTarget(null)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} /> Remove set
                </button>
              </div>
            </Modal>
          )
        })()}

      {focusEntryIndex != null &&
        entries[focusEntryIndex] &&
        (() => {
          const entry = entries[focusEntryIndex]
          const info = exercisesById.get(entry.exerciseId)
          return (
            <ExerciseFocusModal
              exercise={{
                id: entry.exerciseId,
                name: entry.exerciseName,
                notes: info?.notes,
                cues: info?.cues,
                formCues: info?.formCues,
                targetMuscles: info?.targetMuscles,
                muscleGroup: info?.muscleGroup,
                muscleSubgroup: info?.muscleSubgroup,
                source: info?.source,
              }}
              sessions={sessions}
              excludeSessionId={session.id}
              onSaveNote={(data) => onSaveNote(entry.exerciseId, data)}
              onClose={() => setFocusEntryIndex(null)}
            />
          )
        })()}

      {showMuscleMap && (
        <MuscleMapModal
          title="Today's muscle map"
          data={buildMuscleData(
            entries.map((e) => {
              const completedCount = e.sets.filter((s) => s.completed).length
              return {
                exerciseId: e.exerciseId,
                exerciseName: e.exerciseName,
                // Before anything's checked off, show the planned session
                // (like the Plan tab preview) instead of an empty map —
                // completed counts take over once a set is logged.
                setCount: anySetCompleted ? completedCount : e.sets.length,
              }
            }),
            exercisesById,
          )}
          onClose={() => setShowMuscleMap(false)}
        />
      )}

      {savingAsTemplate && (
        <SaveAsTemplateModal
          onClose={() => setSavingAsTemplate(false)}
          onSave={(name) => {
            const now = Date.now()
            addTemplate({
              name,
              entries: entries.map((e) => ({
                exerciseId: e.exerciseId,
                exerciseName: e.exerciseName,
                plannedSets: e.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
              })),
              createdAt: now,
              updatedAt: now,
            })
            // Naming it is also the point where today's already-logged
            // entries themselves collapse under that name — otherwise
            // "save as a workout" only helps future sessions, never this
            // one, which reads as if naming it did nothing.
            const blockId = String(now)
            commit(entries.map((e) => ({ ...e, blockId, blockTitle: name })))
            setSavingAsTemplate(false)
          }}
        />
      )}
    </div>
  )
}

/** Composing a workout on the fly (rather than starting a saved one) never
 * used to leave anything reusable behind — this lets you turn today's
 * session into a template after the fact, once you know it's a keeper. */
function SaveAsTemplateModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <Modal title="Save as a workout" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-400">
          Saves today's exercises (and current sets) as a reusable workout under Plan, so you can
          start it again later.
        </p>
        <input
          autoFocus
          placeholder='Name, e.g. "Push Day A"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSave(name.trim())
          }}
          className={inputClass}
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
          className={`${primaryButtonClass} disabled:opacity-40`}
        >
          Save workout
        </button>
      </div>
    </Modal>
  )
}
