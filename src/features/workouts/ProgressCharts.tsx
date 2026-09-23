import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/** Shared chart chrome for the Progress tab — recessive grid/axes, 2px
 * lines, 8px markers, 4px-rounded bar tops, one tooltip style — so every
 * chart on the tab reads as one system. */

const GRID = '#27272a'
const AXIS = '#737373'
const TOOLTIP_STYLE = {
  background: '#171717',
  border: '1px solid #404040',
  borderRadius: 8,
  fontSize: 12,
  color: '#e5e5e5',
}

export function Card({
  title,
  aside,
  children,
  className,
}: {
  title?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-xl border border-neutral-800 bg-neutral-900 p-3', className)}>
      {(title || aside) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title && <p className="text-xs font-medium text-neutral-400">{title}</p>}
          {aside}
        </div>
      )}
      {children}
    </div>
  )
}

/** Small pill toggle row, e.g. "e1RM · Top set · Volume". */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-medium transition',
            value === o.key
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TrendLine<T extends { date: string }>({
  data,
  dataKey,
  color = '#818cf8',
  formatValue = (v) => v.toLocaleString(),
  label,
  height = 180,
}: {
  data: T[]
  dataKey: keyof T & string
  color?: string
  formatValue?: (v: number) => string
  /** Tooltip name for the value, e.g. "e1RM". */
  label: string
  height?: number
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            stroke={AXIS}
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke={AXIS}
            fontSize={11}
            width={40}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v) => formatValue(v as number)}
          />
          <Tooltip
            labelFormatter={(d) => format(parseISO(d as string), 'EEE, MMM d, yyyy')}
            formatter={(v) => [formatValue(v as number), label]}
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: '#525252' }}
          />
          <Line
            type="linear"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: '#171717', fill: color }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#171717' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WeeklyBars<T extends { weekStart: string }>({
  data,
  dataKey,
  color = '#0d9488',
  label,
  unit,
  height = 160,
}: {
  data: T[]
  dataKey: keyof T & string
  color?: string
  label: string
  unit: string
  height?: number
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="weekStart"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            stroke={AXIS}
            fontSize={11}
            tickLine={false}
          />
          <YAxis stroke={AXIS} fontSize={11} width={32} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            labelFormatter={(d) => `Week of ${format(parseISO(d as string), 'MMM d')}`}
            formatter={(v) => [`${(v as number).toLocaleString()} ${unit}`, label]}
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: '#ffffff08' }}
          />
          <Bar dataKey={dataKey as string} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** A headline number with a label, for the top of a detail view. */
export function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-neutral-950/60 px-2.5 py-2">
      <p className="truncate text-[11px] text-neutral-500">{label}</p>
      <p className="truncate text-base font-semibold text-neutral-100">{value}</p>
      {sub && <p className="truncate text-[11px] text-neutral-500">{sub}</p>}
    </div>
  )
}
