import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const ACCENTS = {
  indigo: { chip: 'bg-indigo-500/20 text-indigo-400', blob: 'bg-indigo-500/20' },
  amber: { chip: 'bg-amber-500/20 text-amber-400', blob: 'bg-amber-500/20' },
  emerald: { chip: 'bg-emerald-500/20 text-emerald-400', blob: 'bg-emerald-500/20' },
  rose: { chip: 'bg-rose-500/20 text-rose-400', blob: 'bg-rose-500/20' },
  cyan: { chip: 'bg-cyan-500/20 text-cyan-400', blob: 'bg-cyan-500/20' },
  sky: { chip: 'bg-sky-500/20 text-sky-400', blob: 'bg-sky-500/20' },
  violet: { chip: 'bg-violet-500/20 text-violet-400', blob: 'bg-violet-500/20' },
} as const

export type WidgetAccent = keyof typeof ACCENTS

interface WidgetCardProps {
  title: string
  icon?: React.ReactNode
  accent?: WidgetAccent
  to?: string
  /** Use instead of `to` when the card needs a default destination while
   * still containing its own more-specific links (which should call
   * `e.stopPropagation()` so they win over this fallback). */
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function WidgetCard({
  title,
  icon,
  accent = 'indigo',
  to,
  onClick,
  children,
  className,
}: WidgetCardProps) {
  const { chip, blob } = ACCENTS[accent]
  const clickable = Boolean(to || onClick)

  const content = (
    <div
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-neutral-800/70 bg-neutral-900 p-5 shadow-lg shadow-black/20 transition',
        clickable && 'hover:border-neutral-700 active:scale-[0.99]',
        className,
      )}
    >
      <div className={clsx('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl', blob)} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className={clsx('flex h-7 w-7 items-center justify-center rounded-xl', chip)}>{icon}</span>}
            <span className="text-sm font-medium text-neutral-300">{title}</span>
          </div>
          {clickable && <ChevronRight size={16} className="text-neutral-600" />}
        </div>
        {children}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <div role="button" tabIndex={0} onClick={onClick} className="block w-full text-left">
        {content}
      </div>
    )
  }

  return content
}
