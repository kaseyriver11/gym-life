import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/components/form'
import type { MuscleTarget } from '@/types'
import { MUSCLE_PICKER_OPTIONS } from './body-map'

/** Primary/secondary muscle picker shared by the custom-exercise form and
 * the Focus view's personal override — one primary mover (the app only
 * weights one full-strength target per exercise) plus as many secondary/
 * assisting muscles as apply, matching the same role model the research
 * catalog uses so a custom exercise's heatmap behaves the same way a
 * catalog exercise's does. Primary is a real dropdown (single choice);
 * secondary is a collapsible checklist dropdown, since a native multi-
 * select is a poor touch-target fit for "pick as many as apply". */
export function MuscleRolePicker({
  value,
  onChange,
}: {
  value: MuscleTarget[]
  onChange: (value: MuscleTarget[]) => void
}) {
  const primary = value.find((t) => t.role === 'primary')?.muscle ?? ''
  const secondary = value.filter((t) => t.role === 'secondary').map((t) => t.muscle)
  const secondaryLabels = MUSCLE_PICKER_OPTIONS.filter(({ value: v }) => secondary.includes(v)).map(
    (o) => o.label,
  )

  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const secondaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!secondaryOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (secondaryRef.current && !secondaryRef.current.contains(e.target as Node)) {
        setSecondaryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [secondaryOpen])

  function setPrimary(muscle: string) {
    const secondaryEntries: MuscleTarget[] = secondary
      .filter((m) => m !== muscle)
      .map((m) => ({ muscle: m, role: 'secondary' }))
    onChange(muscle ? [{ muscle, role: 'primary' }, ...secondaryEntries] : secondaryEntries)
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
          Primary muscle <span className="text-neutral-700">(the main mover)</span>
        </label>
        <div className="relative">
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className={`${inputClass} appearance-none pr-8`}
          >
            <option value="">None selected</option>
            {MUSCLE_PICKER_OPTIONS.map(({ value: v, label }) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
        </div>
      </div>

      <div ref={secondaryRef} className="relative">
        <label className="mb-1 block text-xs text-neutral-500">
          Secondary muscles <span className="text-neutral-700">(optional — pick as many as apply)</span>
        </label>
        <button
          type="button"
          onClick={() => setSecondaryOpen((open) => !open)}
          className={`${inputClass} flex items-center justify-between gap-2 text-left`}
        >
          <span className={clsx('truncate', secondaryLabels.length === 0 && 'text-neutral-500')}>
            {secondaryLabels.length > 0 ? secondaryLabels.join(', ') : 'None selected'}
          </span>
          <ChevronDown
            size={14}
            className={clsx(
              'shrink-0 text-neutral-500 transition-transform',
              secondaryOpen && 'rotate-180',
            )}
          />
        </button>
        {secondaryOpen && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-lg">
            {MUSCLE_PICKER_OPTIONS.filter(({ value: v }) => v !== primary).map(({ value: v, label }) => {
              const active = secondary.includes(v)
              return (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSecondary(v)}
                    className="h-4 w-4 shrink-0 accent-teal-600"
                  />
                  {label}
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
