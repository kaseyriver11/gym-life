import clsx from 'clsx'
import { differenceInCalendarDays, format, parseISO, subMonths } from 'date-fns'
import { Camera, Columns2, Plus, Ruler, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import { Card, Chips, Stat, TrendLine } from '@/features/workouts/ProgressCharts'
import { useActiveProgram } from '@/features/workouts/use-programs'
import type { BodyCheck, HealthSnapshot } from '@/types'
import {
  DEFAULT_TRACKED,
  MEASUREMENTS,
  measurementHistory,
  signed,
  useBodyChecks,
  weightSeries,
  weightStats,
} from './body-metrics'
import {
  POSES,
  capturePhoto,
  deletePhoto,
  listPhotos,
  photoSrc,
  photosAvailable,
  type Pose,
  type ProgressPhoto,
} from './progress-photos'
import { useProfile } from './use-profile'

const WEIGHT_HEX = '#34d399'
type Range = '1m' | '3m' | '6m' | 'all'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// ---------------------------------------------------------------------------
// Weight

function WeightCard({ snapshots }: { snapshots: HealthSnapshot[] }) {
  const { active } = useActiveProgram()
  const [range, setRange] = useState<Range>('3m')
  const series = useMemo(() => weightSeries(snapshots), [snapshots])
  const stats = useMemo(() => weightStats(series, active?.startDate), [series, active?.startDate])

  const from =
    range === 'all' ? '' : format(subMonths(new Date(), range === '1m' ? 1 : range === '3m' ? 3 : 6), 'yyyy-MM-dd')
  const data = series.filter((p) => p.date >= from)
  const blockStart = active && data.length > 0 && active.startDate <= data[data.length - 1].date
    ? (active.startDate < data[0].date ? data[0].date : active.startDate)
    : null

  if (series.length === 0) {
    return (
      <Card title="Bodyweight">
        <p className="py-3 text-center text-sm text-neutral-500">Log your weight below to start a trend.</p>
      </Card>
    )
  }

  return (
    <Card
      title="Bodyweight"
      aside={
        <Chips
          options={[
            { key: '1m', label: '1M' },
            { key: '3m', label: '3M' },
            { key: '6m', label: '6M' },
            { key: 'all', label: 'All' },
          ]}
          value={range}
          onChange={setRange}
        />
      }
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Stat label="7-day avg" value={`${stats.avg} lb`} sub={`last ${stats.current} lb`} />
        <Stat
          label="This week"
          value={stats.weekChange != null ? signed(stats.weekChange, ' lb') : '—'}
          sub="vs. last week's avg"
        />
        <Stat
          label="Trend"
          value={stats.ratePerWeek != null ? `${signed(stats.ratePerWeek)}/wk` : '—'}
          sub={stats.ratePerWeek != null ? 'over 4 weeks' : 'needs 2+ weeks'}
        />
      </div>

      {data.length >= 2 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              {blockStart && (
                <ReferenceArea
                  x1={blockStart}
                  x2={data[data.length - 1].date}
                  fill="#6366f1"
                  fillOpacity={0.08}
                  ifOverflow="hidden"
                />
              )}
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'M/d')}
                stroke="#737373"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#737373"
                fontSize={11}
                width={36}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v) => `${Math.round(v as number)}`}
              />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), 'EEE, MMM d, yyyy')}
                formatter={(v, name) => [`${v} lb`, name === 'avg' ? '7-day avg' : 'Weigh-in']}
                contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
              />
              <Line
                dataKey="weight"
                stroke="none"
                dot={{ r: 3, fill: '#737373', stroke: 'none' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="avg"
                stroke={WEIGHT_HEX}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-neutral-500">One weigh-in in this range.</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-neutral-500" /> Weigh-in
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded" style={{ background: WEIGHT_HEX }} /> 7-day average
        </span>
        {active && blockStart && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-3 rounded-sm bg-indigo-500/25" /> {active.name}
            {stats.sinceChange != null && ` (${signed(stats.sinceChange, ' lb')})`}
          </span>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Measurements

function MeasurementsCard({
  checks,
  tracked,
  onCheckIn,
}: {
  checks: BodyCheck[]
  tracked: string[]
  onCheckIn: () => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  const last = [...checks].sort((a, b) => b.date.localeCompare(a.date))[0]
  const daysSince = last ? differenceInCalendarDays(new Date(), parseISO(last.date)) : null
  const rows = [
    ...MEASUREMENTS.filter((m) => tracked.includes(m.key)),
    { key: 'bodyFat', label: 'Body fat' },
  ]

  return (
    <Card
      title="Measurements"
      aside={
        <button
          onClick={onCheckIn}
          className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25"
        >
          <Plus size={12} /> Check in
        </button>
      }
    >
      {checks.length === 0 ? (
        <p className="py-2 text-xs text-neutral-500">
          A weekly check-in — weight, tape measurements, body fat if you know it, and photos — all on one screen.
          Measure first thing in the morning, same spots each time.
        </p>
      ) : (
        <>
          {daysSince != null && daysSince >= 7 && (
            <p className="mb-2 text-xs text-emerald-300">Last check-in was {daysSince} days ago.</p>
          )}
          <ul className="divide-y divide-neutral-800">
            {rows.map((m) => {
              const history = measurementHistory(checks, m.key)
              const latest = history[history.length - 1]
              const first = history[0]
              const delta = history.length > 1 ? Math.round((latest.value - first.value) * 10) / 10 : null
              const unit = m.key === 'bodyFat' ? '%' : '"'
              if (!latest && m.key === 'bodyFat') return null
              const isOpen = open === m.key
              return (
                <li key={m.key}>
                  <button onClick={() => setOpen(isOpen ? null : m.key)} className="flex w-full items-center gap-2 py-2 text-left">
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{m.label}</span>
                    {delta != null && delta !== 0 && (
                      <span className="text-[11px] text-neutral-500">
                        {signed(delta, unit)} since {format(parseISO(first.date), 'MMM d')}
                      </span>
                    )}
                    <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-neutral-100">
                      {latest ? `${latest.value}${unit}` : '—'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-3">
                      {history.length >= 2 ? (
                        <TrendLine
                          data={history}
                          dataKey="value"
                          color={WEIGHT_HEX}
                          label={m.label}
                          formatValue={(v) => `${v}${unit}`}
                          height={140}
                        />
                      ) : (
                        <p className="text-xs text-neutral-600">
                          {history.length === 1 ? 'One measurement so far.' : 'Not measured yet.'}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Card>
  )
}

function CheckInModal({
  checks,
  tracked,
  todaySnapshot,
  onSaveWeight,
  onSaveCheck,
  onChangeTracked,
  onClose,
  onPhotosChanged,
}: {
  checks: BodyCheck[]
  tracked: string[]
  todaySnapshot?: HealthSnapshot
  onSaveWeight: (lbs: number) => Promise<void>
  onSaveCheck: (data: { measurements: Record<string, number>; bodyFatPct?: number }, existing?: BodyCheck) => Promise<void>
  onChangeTracked: (keys: string[]) => void
  onClose: () => void
  onPhotosChanged: () => void
}) {
  const today = todayISO()
  const existing = checks.find((c) => c.date === today)
  const previous = [...checks].filter((c) => c.date < today).sort((a, b) => b.date.localeCompare(a.date))[0]
  const [weight, setWeight] = useState(todaySnapshot?.weightLbs?.toString() ?? '')
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(existing?.measurements ?? {}).map(([k, v]) => [k, String(v)])),
  )
  const [bodyFat, setBodyFat] = useState(existing?.bodyFatPct?.toString() ?? '')
  const [choosing, setChoosing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shot, setShot] = useState<Partial<Record<Pose, boolean>>>({})

  async function save() {
    setSaving(true)
    try {
      if (weight && Number(weight) > 0) await onSaveWeight(Number(weight))
      const measurements = Object.fromEntries(
        Object.entries(values)
          .filter(([, v]) => v.trim() !== '' && Number(v) > 0)
          .map(([k, v]) => [k, Number(v)]),
      )
      const bf = bodyFat && Number(bodyFat) > 0 ? Number(bodyFat) : undefined
      if (Object.keys(measurements).length > 0 || bf != null) {
        await onSaveCheck({ measurements, bodyFatPct: bf }, existing)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Body check-in" onClose={onClose}>
      <div className="space-y-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-200">Weight</span>
          <span className="relative w-28">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${inputClass} py-1.5 pr-8 text-right`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">lb</span>
          </span>
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Ruler size={13} /> Measurements (inches)
            </p>
            <button
              onClick={() => setChoosing((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300"
            >
              <Settings2 size={12} /> {choosing ? 'Done' : 'Choose'}
            </button>
          </div>
          {choosing ? (
            <div className="grid grid-cols-2 gap-1">
              {MEASUREMENTS.map((m) => (
                <label key={m.key} className="flex items-center gap-2 py-1 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={tracked.includes(m.key)}
                    onChange={() =>
                      onChangeTracked(
                        tracked.includes(m.key) ? tracked.filter((k) => k !== m.key) : [...tracked, m.key],
                      )
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {MEASUREMENTS.filter((m) => tracked.includes(m.key)).map((m) => (
                <label key={m.key} className="min-w-0">
                  <span className="mb-0.5 block truncate text-[11px] text-neutral-500">{m.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.25}
                    placeholder={previous?.measurements[m.key] != null ? `last ${previous.measurements[m.key]}` : ''}
                    value={values[m.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [m.key]: e.target.value }))}
                    className={`${inputClass} py-1.5`}
                  />
                </label>
              ))}
              <label className="min-w-0">
                <span className="mb-0.5 block truncate text-[11px] text-neutral-500">Body fat % (optional)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.1}
                  placeholder={previous?.bodyFatPct != null ? `last ${previous.bodyFatPct}` : ''}
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className={`${inputClass} py-1.5`}
                />
              </label>
            </div>
          )}
        </div>

        {photosAvailable() && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Camera size={13} /> Photos — saved on this phone only
            </p>
            <div className="grid grid-cols-3 gap-2">
              {POSES.map((pose) => (
                <button
                  key={pose}
                  onClick={async () => {
                    const photo = await capturePhoto(today, pose)
                    if (photo) {
                      setShot((prev) => ({ ...prev, [pose]: true }))
                      onPhotosChanged()
                    }
                  }}
                  className={clsx(
                    'rounded-lg border py-2 text-xs capitalize',
                    shot[pose]
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-dashed border-neutral-700 text-neutral-400 hover:border-emerald-500',
                  )}
                >
                  {shot[pose] ? `✓ ${pose}` : pose}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">Same spot, lighting and distance each time makes comparisons useful.</p>
          </div>
        )}

        <button onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save check-in'}
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Photos

function PhotoImg({ photo, className }: { photo: ProgressPhoto; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    photoSrc(photo).then((s) => alive && setSrc(s))
    return () => {
      alive = false
    }
  }, [photo])
  return src ? (
    <img src={src} alt={`${photo.pose}, ${photo.date}`} className={clsx('object-cover', className)} />
  ) : (
    <div className={clsx('bg-neutral-800', className)} />
  )
}

function PhotosCard({ photos, onChanged }: { photos: ProgressPhoto[]; onChanged: () => void }) {
  const [comparing, setComparing] = useState(false)
  const dates = [...new Set(photos.map((p) => p.date))].sort().reverse()

  return (
    <Card
      title="Progress photos"
      aside={
        dates.length >= 2 && (
          <button
            onClick={() => setComparing(true)}
            className="flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
          >
            <Columns2 size={12} /> Compare
          </button>
        )
      }
    >
      {!photosAvailable() ? (
        <p className="text-xs text-neutral-500">Progress photos work in the phone app — they're stored on the phone only.</p>
      ) : dates.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Add front/side/back photos during a check-in. They stay on this phone — never uploaded — and are deleted if
          you uninstall the app.
        </p>
      ) : (
        <ul className="space-y-3">
          {dates.slice(0, 6).map((date) => (
            <li key={date}>
              <p className="mb-1 text-xs text-neutral-400">{format(parseISO(date), 'EEE, MMM d, yyyy')}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {POSES.map((pose) => {
                  const photo = photos.find((p) => p.date === date && p.pose === pose)
                  return photo ? (
                    <div key={pose} className="relative">
                      <PhotoImg photo={photo} className="aspect-[3/4] w-full rounded-md" />
                      <button
                        onClick={async () => {
                          await deletePhoto(photo)
                          onChanged()
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-neutral-300 hover:text-red-400"
                        aria-label="Delete photo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <div key={pose} className="flex aspect-[3/4] items-center justify-center rounded-md bg-neutral-950 text-[10px] capitalize text-neutral-700">
                      {pose}
                    </div>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
      {comparing && <CompareModal photos={photos} dates={dates} onClose={() => setComparing(false)} />}
    </Card>
  )
}

function CompareModal({ photos, dates, onClose }: { photos: ProgressPhoto[]; dates: string[]; onClose: () => void }) {
  const [before, setBefore] = useState(dates[dates.length - 1])
  const [after, setAfter] = useState(dates[0])
  const [pose, setPose] = useState<Pose>('front')
  const pick = (date: string) => photos.find((p) => p.date === date && p.pose === pose)

  return (
    <Modal title="Compare photos" onClose={onClose}>
      <div className="space-y-3">
        <Chips options={POSES.map((p) => ({ key: p, label: p[0].toUpperCase() + p.slice(1) }))} value={pose} onChange={setPose} />
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: before, set: setBefore },
            { value: after, set: setAfter },
          ].map(({ value, set }, i) => {
            const photo = pick(value)
            return (
              <div key={i} className="space-y-1.5">
                <select value={value} onChange={(e) => set(e.target.value)} className={`${inputClass} px-2 py-1 text-xs`}>
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {format(parseISO(d), 'MMM d, yyyy')}
                    </option>
                  ))}
                </select>
                {photo ? (
                  <PhotoImg photo={photo} className="aspect-[3/4] w-full rounded-md" />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-neutral-950 text-xs text-neutral-600">
                    No {pose} photo
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {before && after && (
          <p className="text-center text-xs text-neutral-500">
            {Math.abs(differenceInCalendarDays(parseISO(after), parseISO(before)))} days apart
          </p>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

/** Everything body-composition on the Health tab. */
export function BodySection({
  snapshots,
  onSaveWeight,
}: {
  snapshots: HealthSnapshot[]
  onSaveWeight: (lbs: number) => Promise<void>
}) {
  const { items: checks, add, update } = useBodyChecks()
  const { profile, setProfile } = useProfile()
  const tracked = profile.trackedMeasurements ?? DEFAULT_TRACKED
  const [checkingIn, setCheckingIn] = useState(false)
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const refreshPhotos = () => {
    if (photosAvailable()) listPhotos().then(setPhotos)
  }
  useEffect(refreshPhotos, [])

  const todaySnapshot = snapshots.find((s) => s.date === todayISO())

  return (
    <div className="space-y-4">
      <WeightCard snapshots={snapshots} />
      <MeasurementsCard checks={checks} tracked={tracked} onCheckIn={() => setCheckingIn(true)} />
      <PhotosCard photos={photos} onChanged={refreshPhotos} />
      {checkingIn && (
        <CheckInModal
          checks={checks}
          tracked={tracked}
          todaySnapshot={todaySnapshot}
          onSaveWeight={onSaveWeight}
          onSaveCheck={async (data, existing) => {
            if (existing) await update(existing.id, data)
            else await add({ date: todayISO(), ...data, createdAt: Date.now() })
          }}
          onChangeTracked={(keys) => setProfile({ trackedMeasurements: keys })}
          onClose={() => setCheckingIn(false)}
          onPhotosChanged={refreshPhotos}
        />
      )}
    </div>
  )
}
