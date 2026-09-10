import { format, parseISO } from 'date-fns'
import { Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-3">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <Smartphone size={16} />
          <span className="font-medium">Google Health Connect</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Not connected yet — automatic sync of steps and nutrition needs a native Android
          plugin, tested on your phone. Log manually below for now; we'll wire this up once
          the app is running on your device.
        </p>
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
