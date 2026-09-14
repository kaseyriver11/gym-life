import { format, parseISO } from 'date-fns'
import { Droplet, Footprints, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { inputClass, primaryButtonClass } from '@/components/form'
import {
  connectHealthConnect,
  disconnectHealthConnect,
  fetchTodaySteps,
  healthConnectAvailable,
  isHealthConnectLinked,
} from './health-connect'
import { useHealthSnapshots } from './use-health'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function HealthPage() {
  const { items, add, update } = useHealthSnapshots()
  const today = todayISO()
  const todaySnapshot = items.find((s) => s.date === today)

  const [weight, setWeight] = useState(todaySnapshot?.weightLbs?.toString() ?? '')
  const [steps, setSteps] = useState(todaySnapshot?.steps?.toString() ?? '')
  const [caloriesIn, setCaloriesIn] = useState(todaySnapshot?.caloriesIn?.toString() ?? '')
  const [hcLinked, setHcLinked] = useState(false)
  const [hcBusy, setHcBusy] = useState(false)
  const [hcError, setHcError] = useState<string | null>(null)

  useEffect(() => {
    isHealthConnectLinked().then(setHcLinked)
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

  const weightData = useMemo(
    () =>
      [...items]
        .filter((s) => s.weightLbs != null)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [items],
  )

  async function saveToday(e: React.FormEvent) {
    e.preventDefault()
    const patch = {
      weightLbs: weight ? Number(weight) : undefined,
      steps: steps ? Number(steps) : undefined,
      caloriesIn: caloriesIn ? Number(caloriesIn) : undefined,
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

  return (
    <div className="space-y-4">
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
              Reading step count from Health Connect. Make sure your Garmin Connect app is set
              to sync to Health Connect for your watch's steps to show up here.
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
              Connect to pull your step count from Health Connect (e.g. from a Garmin watch
              synced through Garmin Connect). Log manually below either way.
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
        {hcError && <p className="mt-1.5 text-xs text-red-400">{hcError}</p>}
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
        <div className="grid grid-cols-3 gap-2">
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
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Calories in</label>
            <input
              type="number"
              inputMode="numeric"
              value={caloriesIn}
              onChange={(e) => setCaloriesIn(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <button type="submit" className={primaryButtonClass}>
          Save
        </button>
      </form>

      {weightData.length > 1 && (
        <div className="h-56 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-400">Weight trend</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'M/d')}
                stroke="#737373"
                fontSize={11}
              />
              <YAxis stroke="#737373" fontSize={11} width={36} domain={['auto', 'auto']} />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
                contentStyle={{
                  background: '#171717',
                  border: '1px solid #404040',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="weightLbs"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
