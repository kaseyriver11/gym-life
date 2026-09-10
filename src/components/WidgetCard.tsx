import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface WidgetCardProps {
  title: string
  icon?: React.ReactNode
  to?: string
  children: React.ReactNode
  className?: string
}

export function WidgetCard({ title, icon, to, children, className }: WidgetCardProps) {
  const content = (
    <div
      className={clsx(
        'rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition',
        to && 'hover:border-neutral-700 active:scale-[0.99]',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          {icon}
          <span>{title}</span>
        </div>
        {to && <ChevronRight size={16} className="text-neutral-600" />}
      </div>
      {children}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }
  return content
}
