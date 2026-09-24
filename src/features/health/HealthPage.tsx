import clsx from 'clsx'
import { addDays, format } from 'date-fns'
import { Droplet, Footprints, SlidersHorizontal, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CircularProgress } from '@/components/CircularProgress'
import { BodySection } from './BodySection'
import { inputClass, primaryButtonClass } from '@/components/form'
import { useWorkoutSessions } from '@/features/workouts/use-workout-sessions'
import { useDashboardPrefs } from '../dashboard/use-dashboard-prefs'
import {
  connectHealthConnect,
  disconnectHealthConnect,
  fetchTodaySteps,
  healthConnectAvailable,
  isHealthConnectLinked,
  openHealthConnectSettings,
} from './health-connect'
import { ImportWorkoutsModal } from './HealthImport'
import { useImportCandidates } from './use-import-candidates'
import { useHealthSnapshots } from './use-health'
import { useProfile } from './use-profile'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

function TargetRow({
  label,
  value,
  onSave,
}: {
  label: string
  value: number
  onSave: (value: number) => void
}) {
  const [draft, setDraft] = useState(value.toString())

  function commit() {
    const n = Number(draft)
    if (n > 0) onSave(n)
    else setDraft(value.toString())
  }

  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm text-neutral-300">
      {label}
      <input
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className={`${inputClass} w-20 py-1 text-right`}
      />
    </label>
  )
}

function RingTile({
  label,
  progress,
  accent,
  children,
}: {
  label: string
  progress: number
  accent: 'cyan' | 'sky' | 'emerald'
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-800/70 bg-neutral-900 p-3 shadow-lg shadow-black/20">
      <CircularProgress progress={progress} accent={accent}>
        {children}
      </CircularProgress>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  )
}

function WorkoutsRing({ target }: { target: number }) {
  const { items } = useWorkoutSessions()
  const trainedDates = new Set(items.filter((s) => s.entries.length > 0).map((s) => s.date))
  const now = new Date()
  const sunday = addDays(now, -now.getDay())
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(sunday, i), 'yyyy-MM-dd'))
  const count = weekDates.filter((d) => trainedDates.has(d)).length

  return (
    <RingTile label="Workouts" progress={(count / target) * 100} accent="emerald">
      <span className="text-sm font-semibold text-neutral-50">{count}</span>
      <span className="text-[9px] text-neutral-500">/{target} wk</span>
    </RingTile>
  )
}

/** Opened from "Import workouts": always re-reads Health Connect. */
function HealthImportLauncher({ onClose }: { onClose: () => void }) {
  const importer = useImportCandidates()
  const { refresh } = importer
  useEffect(() => {
    refresh(true)
  }, [refresh])
  return <ImportWorkoutsModal importer={importer} onClose={onClose} />
}

export function HealthPage() {
  const { items, loading, add, update } = useHealthSnapshots()
  const { targets, setTargets } = useDashboardPrefs()
  const { profile, setProfile } = useProfile()
  const today = todayISO()
  const todaySnapshot = items.find((s) => s.date === today)

  const [weight, setWeight] = useState('')
  const [steps, setSteps] = useState('')
  const [hcLinked, setHcLinked] = useState(false)
  const [hcBusy, setHcBusy] = useState(false)
  const [hcError, setHcError] = useState<string | null>(null)
  const [editingTargets, setEditingTargets] = useState(false)
  const [importing, setImporting] = useState(false)
  const syncedTodayRef = useRef(false)

  // The Firestore listener resolves asynchronously — these fields' initial
  // values would otherwise be computed from `items` while it's still empty
  // (`loading` true), permanently leaving the form blank even once today's
  // real snapshot arrives a moment later, since nothing re-syncs local state
  // after the initial render. Sync exactly once, right when loading finishes.
  useEffect(() => {
    if (loading || syncedTodayRef.current) return
    syncedTodayRef.current = true
    setWeight(todaySnapshot?.weightLbs?.toString() ?? '')
    setSteps(todaySnapshot?.steps?.toString() ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
    isHealthConnectLinked().then((linked) => {
      setHcLinked(linked)
      if (!linked) return
      setHcBusy(true)
      syncStepsNow()
        .catch((err) => setHcError(err instanceof Error ? err.message : 'Sync failed.'))
        .finally(() => setHcBusy(false))
    })
    // Auto-sync once, right on arrival — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function syncStepsNow(snapshot = todaySnapshot) {
    const liveSteps = await fetchTodaySteps()
    if (snapshot) {
      await update(snapshot.id, { steps: liveSteps, source: 'health-connect' })
    } else {
      await add({ date: today, steps: liveSteps, source: 'health-connect' })
    }
    setSteps(liveSteps.toString())
  }

  async function handleConnect() {
    setHcBusy(true)
    setHcError(null)
    try {
      await connectHealthConnect()
      setHcLinked(true)
      await syncStepsNow()
    } catch (err) {
      setHcError(err instanceof Error ? err.message : 'Could not connect to Health Connect.')
    } finally {
      setHcBusy(false)
    }
  }

  async function handleDisconnect() {
    setHcBusy(true)
    setHcError(null)
    try {
      await disconnectHealthConnect()
      setHcLinked(false)
    } catch (err) {
      setHcError(err instanceof Error ? err.message : 'Could not disconnect Health Connect.')
    } finally {
      setHcBusy(false)
    }
  }

  async function handleSync() {
    setHcBusy(true)
    setHcError(null)
    try {
      await syncStepsNow()
    } catch (err) {
      setHcError(err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setHcBusy(false)
    }
  }

  async function saveToday(e: React.FormEvent) {
    e.preventDefault()
    const patch = {
      weightLbs: weight ? Number(weight) : undefined,
      steps: steps ? Number(steps) : undefined,
      source: 'manual' as const,
    }
    if (todaySnapshot) {
      await update(todaySnapshot.id, patch)
    } else {
      await add({ date: today, ...patch })
    }
  }

  async function addWater(ounces: number) {
    const next = Math.max(0, (todaySnapshot?.waterOz ?? 0) + ounces)
    if (todaySnapshot) {
      await update(todaySnapshot.id, { waterOz: next })
    } else {
      await add({ date: today, waterOz: next, source: 'manual' })
    }
  }

  const todaySteps = todaySnapshot?.steps ?? 0
  const todayWaterOz = todaySnapshot?.waterOz ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setEditingTargets((v) => !v)}
          className={clsx(
            'rounded-full p-1.5 hover:bg-neutral-900',
            editingTargets ? 'text-indigo-400' : 'text-neutral-500',
          )}
          aria-label="Edit targets"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {editingTargets && (
        <div className="space-y-1 rounded-xl border border-neutral-800/70 bg-neutral-900 p-3">
          <p className="text-xs font-medium text-neutral-400">Daily / weekly targets</p>
          <TargetRow label="Steps" value={targets.steps} onSave={(v) => setTargets({ steps: v })} />
          <TargetRow
            label="Water (oz)"
            value={targets.water}
            onSave={(v) => setTargets({ water: v })}
          />
          <TargetRow
            label="Workouts / week"
            value={targets.workoutsPerWeek}
            onSave={(v) => setTargets({ workoutsPerWeek: v })}
          />

          <p className="mb-1 mt-3 border-t border-neutral-800 pt-3 text-xs font-medium text-neutral-400">
            Profile — personalizes workout calorie estimates
          </p>
          <TargetRow
            label="Age"
            value={profile.ageYears ?? 0}
            onSave={(v) => setProfile({ ageYears: v })}
          />
          <TargetRow
            label="Height (in)"
            value={profile.heightIn ?? 0}
            onSave={(v) => setProfile({ heightIn: v })}
          />
          <label className="flex items-center justify-between gap-3 py-1 text-sm text-neutral-300">
            Sex
            <select
              value={profile.sex ?? ''}
              onChange={(e) => setProfile({ sex: (e.target.value || undefined) as 'male' | 'female' | undefined })}
              className={`${inputClass} w-28 py-1`}
            >
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <RingTile label="Steps" progress={(todaySteps / targets.steps) * 100} accent="cyan">
          <Footprints size={14} className="mb-0.5 text-cyan-400" />
          <span className="text-xs font-semibold text-neutral-50">{todaySteps.toLocaleString()}</span>
        </RingTile>
        <RingTile label="Water" progress={(todayWaterOz / targets.water) * 100} accent="sky">
          <Droplet size={14} className="mb-0.5 text-sky-400" />
          <span className="text-xs font-semibold text-neutral-50">{todayWaterOz}oz</span>
        </RingTile>
        <WorkoutsRing target={targets.workoutsPerWeek} />
      </div>

      <div
        className={`rounded-xl border p-3 ${
          hcLinked ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-dashed border-neutral-700 bg-neutral-900/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <Smartphone size={16} />
            <span className="font-medium">Google Health Connect</span>
          </div>
          {hcLinked && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Footprints size={12} /> Connected
            </span>
          )}
        </div>

        {!healthConnectAvailable() ? (
          <p className="mt-1 text-xs text-neutral-500">
            Only available in the installed Android app, not the web version.
          </p>
        ) : hcLinked ? (
          <>
            <p className="mt-1 text-xs text-neutral-500">
              Reading steps and workouts from Health Connect. Make sure Garmin Connect is set to
              sync to Health Connect. New cardio from your watch shows up on the Log tab to review.
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={handleSync}
                disabled={hcBusy}
                className="flex-1 rounded-lg bg-emerald-500/20 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40"
              >
                {hcBusy ? 'Syncing…' : 'Sync steps now'}
              </button>
              <button
                onClick={() => setImporting(true)}
                className="flex-1 rounded-lg bg-sky-500/20 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/30"
              >
                Import workouts
              </button>
              <button
                onClick={handleDisconnect}
                disabled={hcBusy}
                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-700 disabled:opacity-40"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs text-neutral-500">
              Connect to pull steps and import cardio workouts from Health Connect (e.g. a Garmin
              watch synced through Garmin Connect). Read-only — nothing is written back.
            </p>
            <button
              onClick={handleConnect}
              disabled={hcBusy}
              className="mt-2 w-full rounded-lg bg-sky-500/20 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/30 disabled:opacity-40"
            >
              {hcBusy ? 'Connecting…' : 'Connect Health Connect'}
            </button>
          </>
        )}
        {hcError && (
          <p className="mt-1.5 text-xs text-red-400">
            {hcError}{' '}
            <button onClick={() => openHealthConnectSettings()} className="underline">
              Open Health Connect
            </button>
          </p>
        )}
        {importing && <HealthImportLauncher onClose={() => setImporting(false)} />}
      </div>

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-sky-300">
            <Droplet size={15} /> Water
          </p>
          <p className="text-sm text-neutral-300">{todaySnapshot?.waterOz ?? 0} oz today</p>
        </div>
        <div className="mt-2 flex gap-1.5">
          {[8, 16, 32].map((oz) => (
            <button
              key={oz}
              onClick={() => addWater(oz)}
              className="flex-1 rounded-lg bg-sky-500/20 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/30"
            >
              +{oz} oz
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={saveToday} className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
        <p className="text-sm font-medium text-neutral-300">Today</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Weight (lbs)</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Steps</label>
            <input
              type="number"
              inputMode="numeric"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <button type="submit" className={primaryButtonClass}>
          Save
        </button>
      </form>

      <BodySection
        snapshots={items}
        onSaveWeight={async (lbs) => {
          setWeight(lbs.toString())
          if (todaySnapshot) await update(todaySnapshot.id, { weightLbs: lbs })
          else await add({ date: today, weightLbs: lbs, source: 'manual' })
        }}
      />
    </div>
  )
}
