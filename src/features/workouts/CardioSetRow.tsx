import clsx from 'clsx'
import { ChevronDown, ChevronUp, MoreVertical, Watch } from 'lucide-react'
import { useState } from 'react'
import { inputClass } from '@/components/form'
import type { UserProfile, WorkoutSet } from '@/types'
import { estimateCardioCalories } from './calories'
import { formatSeconds } from './progress-stats'

function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') e.currentTarget.blur()
}

/** Small labelled number field for the details grid. Empty = unset. */
function DetailField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
  step?: number
}) {
  return (
    <label className="min-w-0">
      <span className="mb-0.5 block text-[10px] text-neutral-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value ?? ''}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        onKeyDown={blurOnEnter}
        className={`${inputClass} px-2 py-1 text-center`}
      />
    </label>
  )
}

/**
 * One cardio block (or interval) — time + distance up front, everything
 * else (effort, heart rate, incline/resistance, calories) one tap away so
 * the row still fits on a phone. The collapsed summary line shows whatever
 * of those is filled in, plus pace computed from time and distance.
 */
export function CardioSetRow({
  set,
  label,
  entryIndex,
  setIndex,
  exerciseName,
  weightLbs,
  profile,
  onChange,
  onToggleComplete,
  onMenu,
  timingSlot,
}: {
  set: WorkoutSet
  label: React.ReactNode
  entryIndex: number
  setIndex: number
  exerciseName: string
  weightLbs?: number
  profile?: UserProfile
  onChange: (patch: Partial<WorkoutSet>) => void
  onToggleComplete: () => void
  onMenu: () => void
  /** The live stopwatch controls, when this block is being timed. */
  timingSlot?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const seconds = set.durationSeconds ?? 0
  const miles = set.distanceMiles ?? 0
  const pace = seconds > 0 && miles > 0 ? seconds / miles : undefined
  const calories =
    set.calories ?? (seconds > 0 ? estimateCardioCalories(exerciseName, seconds, set.intensity, weightLbs ?? 180, profile) : undefined)

  const summary = [
    pace != null && `${formatSeconds(pace)}/mi`,
    set.avgHeartRate != null && `${set.avgHeartRate} bpm avg${set.maxHeartRate != null ? ` · ${set.maxHeartRate} max` : ''}`,
    set.avgHeartRate == null && set.maxHeartRate != null && `${set.maxHeartRate} bpm max`,
    set.incline != null && `${set.incline}% incline`,
    set.resistance != null && `level ${set.resistance}`,
    set.intensity && set.intensity !== 'moderate' && set.intensity,
    calories != null && calories > 0 && `~${calories} cal`,
  ].filter(Boolean) as string[]

  const estimateClass = set.isEstimate && 'text-neutral-500 animate-pulse-slow'

  return (
    <div className="rounded-lg bg-neutral-950/40 px-1.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="w-6 shrink-0 text-xs text-neutral-500">{label}</span>
        <label className="relative min-w-0 flex-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            id={`reps-${entryIndex}-${setIndex}`}
            placeholder="min"
            value={seconds ? Math.round((seconds / 60) * 100) / 100 : ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              onChange({ durationSeconds: Math.round((Number(e.target.value) || 0) * 60), isEstimate: false })
            }
            onKeyDown={blurOnEnter}
            className={clsx(`${inputClass} py-1.5 pr-9`, estimateClass)}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">
            min
          </span>
        </label>
        <label className="relative min-w-0 flex-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            id={`weight-${entryIndex}-${setIndex}`}
            placeholder="dist"
            value={miles || ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onChange({ distanceMiles: Number(e.target.value) || 0, isEstimate: false })}
            onKeyDown={blurOnEnter}
            className={clsx(`${inputClass} py-1.5 pr-7`, estimateClass)}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">
            mi
          </span>
        </label>
        <button
          onClick={onToggleComplete}
          className={clsx(
            'h-7 w-7 shrink-0 rounded-full border-2',
            set.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
          )}
          aria-label="Set completed"
        />
        <button
          onClick={onMenu}
          className="flex h-8 w-6 shrink-0 items-center justify-center text-neutral-600 hover:text-neutral-200"
          aria-label="Set options"
        >
          <MoreVertical size={15} />
        </button>
      </div>

      {timingSlot && <div className="mt-1.5 pl-8">{timingSlot}</div>}

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex w-full items-center gap-1.5 pl-8 text-left text-[11px] text-neutral-500 hover:text-neutral-300"
      >
        {set.externalId && (
          <span className="flex shrink-0 items-center gap-0.5 rounded bg-sky-500/15 px-1 py-px text-sky-300">
            <Watch size={10} /> watch
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {summary.length > 0 ? summary.join(' · ') : 'Add effort, heart rate, incline…'}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 pl-8">
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[10px] text-neutral-500">Effort</span>
            {(['easy', 'moderate', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => onChange({ intensity: level, isEstimate: false })}
                className={clsx(
                  'rounded-full px-2 py-1 text-[10px] font-medium capitalize',
                  (set.intensity ?? 'moderate') === level
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'text-neutral-500 hover:text-neutral-300',
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <DetailField label="Avg HR" value={set.avgHeartRate} onChange={(v) => onChange({ avgHeartRate: v })} />
            <DetailField label="Max HR" value={set.maxHeartRate} onChange={(v) => onChange({ maxHeartRate: v })} />
            <DetailField
              label="Calories"
              value={set.calories ?? calories}
              onChange={(v) => onChange({ calories: v })}
            />
            <DetailField label="Incline %" value={set.incline} step={0.5} onChange={(v) => onChange({ incline: v })} />
            <DetailField label="Resistance" value={set.resistance} onChange={(v) => onChange({ resistance: v })} />
          </div>
          <p className="text-[10px] text-neutral-600">
            Calories are estimated from time and effort — overwrite with your machine's or watch's number.
          </p>
        </div>
      )}
    </div>
  )
}
