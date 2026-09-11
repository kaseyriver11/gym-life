import clsx from 'clsx'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass } from '@/components/form'
import { BAR_WEIGHTS } from './plates'
import { warmupSets } from './warmup'

export function WarmupCalcModal({
  initialWeight,
  onClose,
}: {
  initialWeight: number
  onClose: () => void
}) {
  const [weight, setWeight] = useState((initialWeight || 135).toString())
  const [barWeight, setBarWeight] = useState<(typeof BAR_WEIGHTS)[number]>(45)

  const target = Number(weight) || 0
  const sets = warmupSets(target, barWeight)

  return (
    <Modal title="Warm-up ramp" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Work set weight (lbs)</label>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
          {BAR_WEIGHTS.map((bw) => (
            <button
              key={bw}
              type="button"
              onClick={() => setBarWeight(bw)}
              className={clsx(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition',
                barWeight === bw ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
              )}
            >
              {bw === 0 ? 'No bar' : `${bw} lb bar`}
            </button>
          ))}
        </div>

        {sets.length === 0 ? (
          <p className="rounded-xl bg-neutral-800/50 p-4 text-center text-sm text-neutral-400">
            {target <= 0
              ? 'Enter a work weight to build a ramp.'
              : "Work weight is light enough to skip warming up — just go."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {sets.map((set, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2"
              >
                <span className="text-sm text-neutral-200">
                  {set.weight} lbs <span className="text-neutral-500">× {set.reps}</span>
                </span>
                <span className="text-xs text-neutral-500">{set.label}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 px-3 py-2">
              <span className="text-sm font-medium text-indigo-300">{target} lbs</span>
              <span className="text-xs text-indigo-400">Work set</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
