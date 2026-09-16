import { Minus, Pause, Play, Plus, TimerReset, X } from 'lucide-react'
import { formatTime, REST_PRESETS, type RestTimer } from './use-rest-timer'

export function RestTimerBar({ timer }: { timer: RestTimer }) {
  if (timer.idle) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
        <div className="flex items-center gap-2">
          <TimerReset size={16} className="shrink-0 text-neutral-500" />
          <p className="shrink-0 text-xs text-neutral-500">Rest Timer</p>
          <button
            onClick={() => timer.startStopwatch()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            aria-label="Start rest timer (counts up)"
            title="Start a free timer that counts up"
          >
            <Play size={11} />
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-1.5">
            {REST_PRESETS.map((seconds) => (
              <button
                key={seconds}
                onClick={() => timer.start(seconds)}
                className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
              >
                {seconds < 60 ? `${seconds}s` : formatTime(seconds)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (timer.mode === 'stopwatch') {
    return (
      <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-3">
        <div className="flex items-center justify-between">
          <p className="truncate text-xs font-medium text-teal-300">
            {timer.label ? `Timing · ${timer.label}` : 'Timing'}
          </p>
          <button
            onClick={timer.reset}
            className="text-neutral-500 hover:text-neutral-300"
            aria-label="Stop timer"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-neutral-50">
            {formatTime(timer.elapsed)}
          </span>
        </div>
        <button
          onClick={timer.running ? timer.pause : timer.resume}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
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
      </div>
    )
  }

  const progress = Math.min(100, ((timer.duration - timer.remaining) / timer.duration) * 100)
  const done = timer.remaining === 0

  return (
    <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-indigo-300">
          {done ? 'Rest complete' : 'Resting'}
        </p>
        <button
          onClick={timer.reset}
          className="text-neutral-500 hover:text-neutral-300"
          aria-label="Cancel timer"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-center gap-4">
        <button
          onClick={() => timer.addSeconds(-15)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          aria-label="Subtract 15 seconds"
        >
          <Minus size={14} />
        </button>
        <span className="w-16 text-center text-2xl font-semibold tabular-nums text-neutral-50">
          {formatTime(timer.remaining)}
        </span>
        <button
          onClick={() => timer.addSeconds(15)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          aria-label="Add 15 seconds"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-neutral-800">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!done && (
        <button
          onClick={timer.running ? timer.pause : timer.resume}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
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
      )}
    </div>
  )
}
