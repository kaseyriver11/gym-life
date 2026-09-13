import clsx from 'clsx'
import type { MuscleTarget } from '@/types'
import { MUSCLE_PICKER_OPTIONS } from './body-map'

/** Primary/secondary muscle picker shared by the custom-exercise form and
 * the Focus view's personal override — one primary mover (the app only
 * weights one full-strength target per exercise) plus as many secondary/
 * assisting muscles as apply, matching the same role model the research
 * catalog uses so a custom exercise's heatmap behaves the same way a
 * catalog exercise's does. Both rows use the same chip style — a native
 * <select> for "pick one" looked out of place next to the chip-based
 * secondary picker. */
export function MuscleRolePicker({
  value,
  onChange,
}: {
  value: MuscleTarget[]
  onChange: (value: MuscleTarget[]) => void
}) {
  const primary = value.find((t) => t.role === 'primary')?.muscle ?? ''
  const secondary = value.filter((t) => t.role === 'secondary').map((t) => t.muscle)

  function setPrimary(muscle: string) {
    const nextPrimary = muscle === primary ? '' : muscle
    const secondaryEntries: MuscleTarget[] = secondary
      .filter((m) => m !== nextPrimary)
      .map((m) => ({ muscle: m, role: 'secondary' }))
    onChange(nextPrimary ? [{ muscle: nextPrimary, role: 'primary' }, ...secondaryEntries] : secondaryEntries)
  }

  function toggleSecondary(muscle: string) {
    const active = secondary.includes(muscle)
    const nextSecondary = active ? secondary.filter((m) => m !== muscle) : [...secondary, muscle]
    const primaryEntry: MuscleTarget[] = primary ? [{ muscle: primary, role: 'primary' }] : []
    onChange([...primaryEntry, ...nextSecondary.map((m) => ({ muscle: m, role: 'secondary' as const }))])
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500">
          Primary muscle <span className="text-neutral-700">(the main mover — tap to pick, tap again to clear)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_PICKER_OPTIONS.map(({ value: v, label }) => {
            const active = v === primary
            return (
              <button
                key={v}
                type="button"
                onClick={() => setPrimary(v)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition',
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">
          Secondary muscles <span className="text-neutral-700">(optional — pick as many as apply)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_PICKER_OPTIONS.filter(({ value: v }) => v !== primary).map(({ value: v, label }) => {
            const active = secondary.includes(v)
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleSecondary(v)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition',
                  active
                    ? 'bg-teal-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
