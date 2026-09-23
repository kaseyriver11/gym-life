import clsx from 'clsx'
import { Minus, Plus } from 'lucide-react'

/** Thumb-sized +/- stepper wrapped around the existing manual number input —
 * for one-handed gym use the buttons are the primary way to move the value,
 * but typing an exact number (or one the step doesn't land on) still works
 * exactly like the plain input did. */
export function NumberStepper({
  value,
  step,
  min = 0,
  placeholder,
  decimal,
  isEstimate,
  onChange,
  className,
  id,
  onKeyDown,
}: {
  value: number
  step: number
  min?: number
  placeholder?: string
  decimal?: boolean
  /** True while this is still an unconfirmed suggested value rather than
   * something actually entered/done — greys the number out so a glance at
   * the list shows what's really been performed today vs. what's still
   * just a plan. */
  isEstimate?: boolean
  onChange: (value: number) => void
  className?: string
  id?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  function nudge(delta: number) {
    const next = Math.round((value + delta) * 100) / 100
    onChange(Math.max(min, next))
  }

  return (
    <div className={clsx('flex items-center gap-0.5', className)}>
      <button
        type="button"
        onClick={() => nudge(-step)}
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 active:bg-neutral-700"
        aria-label={`Decrease by ${step}`}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        inputMode={decimal ? 'decimal' : 'numeric'}
        min={min}
        id={id}
        placeholder={placeholder}
        value={value === 0 ? '' : value}
        onFocus={(e) => e.target.select()}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          // A leading zero left over from clearing the field would otherwise
          // stick around as you type ("30" -> "030") — strip it, and force
          // the DOM value in sync since a controlled number input won't
          // always repaint a same-looking numeric value on its own.
          const raw = e.target.value.replace(/^0+(?=\d)/, '')
          e.target.value = raw
          onChange(Number(raw) || 0)
        }}
        className={clsx(
          'w-11 shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 py-1.5 text-center text-sm font-semibold outline-none focus:border-indigo-500',
          isEstimate ? 'text-neutral-500 animate-pulse-slow' : 'text-neutral-50',
        )}
      />
      <button
        type="button"
        onClick={() => nudge(step)}
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 active:bg-neutral-700"
        aria-label={`Increase by ${step}`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
