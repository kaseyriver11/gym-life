import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/components/form'
import type { MuscleTarget } from '@/types'
import { MUSCLE_PICKER_OPTIONS } from './body-map'

/** A collapsible multi-select checklist dropdown — shared shape for the
 * secondary and stabilizer sections below, since a native multi-select is a
 * poor touch-target fit for "pick as many as apply". */
function RoleChecklist({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string
  hint: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (muscle: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = options.filter(({ value: v }) => selected.includes(v)).map((o) => o.label)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs text-neutral-500">
        {label} <span className="text-neutral-700">({hint})</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={clsx('truncate', labels.length === 0 && 'text-neutral-500')}>
          {labels.length > 0 ? labels.join(', ') : 'None selected'}
        </span>
        <ChevronDown
          size={14}
          className={clsx('shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-lg">
          {options.map(({ value: v, label: l }) => {
            const active = selected.includes(v)
            return (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggle(v)}
                  className="h-4 w-4 shrink-0 accent-teal-600"
                />
                {l}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Primary/secondary/stabilizer muscle picker shared by the custom-exercise
 * form and the Focus view's personal override — one primary mover (the app
 * only weights one full-strength target per exercise), plus as many
 * secondary/assisting or stabilizer/minor-involvement muscles as apply,
 * matching the same role model the research catalog uses. A muscle's role
 * alone is enough to drive an accurate-looking heatmap: unless a catalog
 * exercise supplies a real measured activationScore, weightsForExercise()
 * falls back to a flat per-role weight (primary 0.9 / secondary 0.5 /
 * stabilizer 0.2) — so a custom exercise never needs the user to type in a
 * number, it just needs the right role picked for each muscle. */
export function MuscleRolePicker({
  value,
  onChange,
}: {
  value: MuscleTarget[]
  onChange: (value: MuscleTarget[]) => void
}) {
  const primary = value.find((t) => t.role === 'primary')?.muscle ?? ''
  const secondary = value.filter((t) => t.role === 'secondary').map((t) => t.muscle)
  const stabilizer = value.filter((t) => t.role === 'stabilizer').map((t) => t.muscle)

  function rebuild(next: { primary?: string; secondary?: string[]; stabilizer?: string[] }) {
    const p = next.primary ?? primary
    const s = next.secondary ?? secondary
    const st = next.stabilizer ?? stabilizer
    onChange([
      ...(p ? [{ muscle: p, role: 'primary' as const }] : []),
      ...s.map((m) => ({ muscle: m, role: 'secondary' as const })),
      ...st.map((m) => ({ muscle: m, role: 'stabilizer' as const })),
    ])
  }

  function setPrimary(muscle: string) {
    rebuild({
      primary: muscle,
      secondary: secondary.filter((m) => m !== muscle),
      stabilizer: stabilizer.filter((m) => m !== muscle),
    })
  }

  // A muscle can only hold one role at a time, so picking it in one
  // checklist silently drops it from the other.
  function toggleSecondary(muscle: string) {
    const active = secondary.includes(muscle)
    rebuild({
      secondary: active ? secondary.filter((m) => m !== muscle) : [...secondary, muscle],
      stabilizer: stabilizer.filter((m) => m !== muscle),
    })
  }

  function toggleStabilizer(muscle: string) {
    const active = stabilizer.includes(muscle)
    rebuild({
      stabilizer: active ? stabilizer.filter((m) => m !== muscle) : [...stabilizer, muscle],
      secondary: secondary.filter((m) => m !== muscle),
    })
  }

  const secondaryOptions = MUSCLE_PICKER_OPTIONS.filter(
    ({ value: v }) => v !== primary && !stabilizer.includes(v),
  )
  const stabilizerOptions = MUSCLE_PICKER_OPTIONS.filter(
    ({ value: v }) => v !== primary && !secondary.includes(v),
  )

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

      <RoleChecklist
        label="Secondary muscles"
        hint="optional — pick as many as apply"
        options={secondaryOptions}
        selected={secondary}
        onToggle={toggleSecondary}
      />

      <RoleChecklist
        label="Stabilizer muscles"
        hint="optional — minor/supporting involvement"
        options={stabilizerOptions}
        selected={stabilizer}
        onToggle={toggleStabilizer}
      />
    </div>
  )
}
