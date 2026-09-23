import { Pause, Play, SkipForward, X } from 'lucide-react'
import { formatTime } from './use-rest-timer'
import type { SequenceTimer } from './use-sequence-timer'

/** Playback bar for a "Start sequence" run through a block of timed
 * poses — shows the current pose's countdown plus what's coming up next, so
 * you can glance and know whether to hold or move, hands-free. */
export function SequencePlayerBar({ timer }: { timer: SequenceTimer }) {
  if (!timer.active) return null

  const isRest = timer.phase === 'rest'
  const total = isRest
    ? timer.steps[timer.stepIndex]?.restSeconds ?? 0
    : timer.steps[timer.stepIndex]?.holdSeconds ?? 0
  const progress = total > 0 ? Math.min(100, ((total - timer.remaining) / total) * 100) : 0

  return (
    <div
      className={
        isRest
          ? 'rounded-xl border border-teal-500/40 bg-teal-500/10 p-3'
          : 'rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3'
      }
    >
      <div className="flex items-center justify-between">
        <p className={isRest ? 'text-xs font-medium text-teal-300' : 'text-xs font-medium text-indigo-300'}>
          {isRest ? 'Reset' : timer.currentLabel}
        </p>
        <button onClick={timer.stop} className="text-neutral-500 hover:text-neutral-300" aria-label="Stop sequence">
          <X size={14} />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-neutral-50">
          {formatTime(timer.remaining)}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-neutral-800">
        <div
          className={isRest ? 'h-1.5 rounded-full bg-teal-500 transition-all' : 'h-1.5 rounded-full bg-indigo-500 transition-all'}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1.5 truncate text-center text-[11px] text-neutral-500">
        {timer.nextLabel ? `Up next: ${timer.nextLabel}` : 'Last one'}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={timer.running ? timer.pause : timer.resume}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
        >
          {timer.running ? (
            <>
              <Pause size={12} /> Pause
            </>
          ) : (
            <>
              <Play size={12} /> Resume
            </>
          )}
        </button>
        <button
          onClick={timer.skip}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
        >
          <SkipForward size={12} /> Skip
        </button>
      </div>
    </div>
  )
}
