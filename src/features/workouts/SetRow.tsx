import clsx from 'clsx'
import { Check, Clock, MoreVertical, Square, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import type { WorkoutSet } from '@/types'
import { NumberStepper } from './NumberStepper'
import { formatTime } from './use-rest-timer'

/** One strength set, in one of three looks:
 *  - completed & collapsed (default once done) — a compact one-line summary
 *    you can tap to expand back into the full editable row
 *  - active — the set you're about to do next, rendered large with the
 *    stepper controls front and center
 *  - upcoming — a later set in the same exercise, shown plain/quiet so you
 *    can still see or jump ahead without it competing for attention
 * Cardio sets keep their own distinct layout inline in LogTab — they're a
 * single duration/distance/intensity block, not a reps×weight row.
 *
 * No dedicated "mark complete" button — reps + weight steppers, the label,
 * and the "..." menu button already fill the available width on a real
 * phone screen, and a fixed-width always-visible circle on top of that
 * pushed the menu button off-screen entirely. "Mark complete" moved into
 * the "..." menu instead; marking it there still collapses the row into
 * the compact checkmark view below. */
export function SetRow({
  label,
  isSided,
  set,
  isActive,
  weightStep,
  isPr,
  isTiming,
  timerElapsed,
  repsId,
  weightId,
  onRepsKeyDown,
  onWeightKeyDown,
  onChangeReps,
  onChangeWeight,
  onStopTiming,
  onCancelTiming,
  onOpenMenu,
}: {
  label: string | number
  isSided: boolean
  set: WorkoutSet
  isActive: boolean
  weightStep: number
  isPr: boolean
  isTiming: boolean
  timerElapsed: number
  /** DOM ids + Enter-key handlers matching LogTab's reps/weight field
   * convention — keeps the existing "Enter jumps to the next field" flow
   * working now that these live inside NumberStepper. */
  repsId: string
  weightId: string
  onRepsKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onWeightKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onChangeReps: (reps: number) => void
  onChangeWeight: (weight: number) => void
  onStopTiming: () => void
  onCancelTiming: () => void
  /** Opens the set's "..." menu — "mark complete" now lives there too (see
   * the module doc comment) rather than as its own always-visible button,
   * which was one of the fixed-width elements that stopped fitting next to
   * the reps/weight steppers on a real phone screen. */
  onOpenMenu: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const collapsed = set.completed && !expanded

  const labelClass = clsx('w-6 shrink-0 text-xs', isSided ? 'font-semibold text-teal-400' : 'text-neutral-500')

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-neutral-800/60"
      >
        <span className={labelClass}>{label}</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-neutral-950">
          <Check size={12} strokeWidth={3} />
        </span>
        <span className="flex-1 text-sm tabular-nums text-neutral-300">
          {set.reps} × {set.weight || 'BW'}
        </span>
        {isPr && <Trophy size={13} className="shrink-0 text-amber-400" aria-label="New personal record" />}
      </button>
    )
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-1 rounded-lg p-1.5',
        isActive && 'border border-indigo-500/40 bg-indigo-500/[0.06]',
      )}
    >
      <span className={labelClass}>{label}</span>
      <NumberStepper
        id={repsId}
        value={set.reps}
        step={1}
        placeholder="reps"
        isEstimate={set.isEstimate}
        onChange={onChangeReps}
        onKeyDown={onRepsKeyDown}
      />
      <NumberStepper
        id={weightId}
        value={set.weight}
        step={weightStep}
        decimal
        placeholder="lbs"
        isEstimate={set.isEstimate}
        onChange={onChangeWeight}
        onKeyDown={onWeightKeyDown}
      />
      {isPr && <Trophy size={13} className="shrink-0 text-amber-400" aria-label="New personal record" />}
      {isTiming ? (
        <span className="flex shrink-0 items-center gap-1">
          <button
            onClick={onStopTiming}
            className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium tabular-nums text-teal-300"
          >
            <Square size={10} /> {formatTime(timerElapsed)}
          </button>
          <button onClick={onCancelTiming} className="text-neutral-600 hover:text-red-400" aria-label="Cancel timing">
            <X size={12} />
          </button>
        </span>
      ) : set.durationSeconds ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500">
          <Clock size={11} /> {formatTime(set.durationSeconds)}
        </span>
      ) : null}
      <button
        onClick={onOpenMenu}
        className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-600 hover:text-neutral-200"
        aria-label="Set options"
      >
        <MoreVertical size={15} />
      </button>
    </div>
  )
}
