import clsx from 'clsx'

const STROKE = {
  indigo: 'stroke-indigo-500',
  amber: 'stroke-amber-500',
  emerald: 'stroke-emerald-500',
  rose: 'stroke-rose-500',
  cyan: 'stroke-cyan-500',
  sky: 'stroke-sky-500',
  violet: 'stroke-violet-500',
} as const

export type RingAccent = keyof typeof STROKE

export function CircularProgress({
  progress,
  accent,
  size = 72,
  strokeWidth = 6,
  children,
}: {
  /** 0-100 */
  progress: number
  accent: RingAccent
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, progress))
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={clsx('fill-none transition-all duration-500', STROKE[accent])}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
