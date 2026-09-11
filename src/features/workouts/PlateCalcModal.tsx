import clsx from 'clsx'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { inputClass } from '@/components/form'
import { BAR_WEIGHTS, platesPerSide } from './plates'

export function PlateCalcModal({
  initialWeight,
  onClose,
}: {
  initialWeight: number
  onClose: () => void
}) {
  const [weight, setWeight] = useState((initialWeight || 135).toString())
  const [barWeight, setBarWeight] = useState<(typeof BAR_WEIGHTS)[number]>(45)

  const target = Number(weight) || 0
  const plates = platesPerSide(target, barWeight)
  const achievable = barWeight + plates.reduce((sum, p) => sum + p, 0) * 2

  return (
    <Modal title="Plate calculator" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Target weight (lbs)</label>
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

        <div className="rounded-xl bg-neutral-800/50 p-4 text-center">
          <p className="mb-2 text-xs text-neutral-500">Per side</p>
          {plates.length === 0 ? (
            <p className="text-sm text-neutral-400">
              {target <= barWeight ? 'Just the bar.' : 'Nothing loads with these plates.'}
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {plates.map((p, i) => (
                <span
                  key={i}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          {achievable !== target && (
            <p className="mt-3 text-xs text-amber-400">
              Closest with these plates: {achievable} lbs (target was {target})
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
