import clsx from 'clsx'
import { ChevronDown, ChevronUp, Minus, Pause, Play, Plus, SkipForward, TimerReset, X } from 'lucide-react'
import { useState } from 'react'
import { formatTime, REST_PRESETS, type RestTimer } from './use-rest-timer'

/**
 * The rest timer. While it's running it sticks to the top of the screen
 * (see the `sticky` wrapper in SessionEditor) so it stays visible however
 * far down the workout you've scrolled. Idle, it's one quiet line — with
 * the switch for whether it starts by itself after each set.
 */
export function RestTimerBar({
  timer,
  autoStart,
  onAutoStartChange,
  onGoNext,
}: {
  timer: RestTimer
  autoStart: boolean
  onAutoStartChange: (next: boolean) => void
  /** Ends the rest and scrolls to your next set. Omitted when every set is done. */
  onGoNext?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (timer.idle) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
        >
          <TimerReset size={16} className="shrink-0 text-neutral-500" />
          <span className="text-xs text-neutral-500">
            Rest timer · {autoStart ? 'starts after each set' : 'off'}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="ml-auto shrink-0 text-neutral-600" />
          ) : (
            <ChevronDown size={14} className="ml-auto shrink-0 text-neutral-600" />
          )}
        </button>
        {expanded && (
          <div className="space-y-3 border-t border-neutral-800 px-3 py-3">
            <label className="flex items-center justify-between gap-3 text-sm text-neutral-200">
              <span>Start automatically after each set</span>
              <button
                role="switch"
                aria-checked={autoStart}
                onClick={() => onAutoStartChange(!autoStart)}
                className={clsx(
                  'relative h-6 w-11 shrink-0 rounded-full transition',
                  autoStart ? 'bg-indigo-500' : 'bg-neutral-700',
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
                    autoStart ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </button>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-neutral-500">Start now</span>
              <button
                onClick={() => timer.startStopwatch()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                aria-label="Start a timer that counts up"
                title="Start a free timer that counts up"
              >
                <Play size={12} />
              </button>
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
        )}
      </div>
    )
  }

  const pauseButton = (
    <button
      onClick={timer.running ? timer.pause : timer.resume}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
    >
      {timer.running ? (
        <>
          <Pause size={13} /> Pause
        </>
      ) : (
        <>
          <Play size={13} /> Resume
        </>
      )}
    </button>
  )

  if (timer.mode === 'stopwatch') {
    return (
      <div className="rounded-xl border border-teal-500/40 bg-neutral-950 p-3 shadow-lg shadow-black/40">
        <div className="rounded-lg bg-teal-500/10 p-2">
          <div className="flex items-center justify-between">
            <p className="truncate text-xs font-medium text-teal-300">
              {timer.label ? `Timing · ${timer.label}` : 'Timing'}
            </p>
            <button onClick={timer.reset} className="text-neutral-500 hover:text-neutral-300" aria-label="Stop timer">
              <X size={14} />
            </button>
          </div>
          <p className="text-center text-2xl font-semibold tabular-nums text-neutral-50">
            {formatTime(timer.elapsed)}
          </p>
          <div className="mt-2 flex gap-2">{pauseButton}</div>
        </div>
      </div>
    )
  }

  const progress = Math.min(100, ((timer.duration - timer.remaining) / timer.duration) * 100)

  return (
    // Solid backing so the workout scrolling underneath doesn't show through.
    <div className="rounded-xl border border-indigo-500/40 bg-neutral-950 shadow-lg shadow-black/40">
      <div className="rounded-xl bg-indigo-500/10 p-3">
        <div className="flex items-center gap-3">
          <p className="w-16 shrink-0 text-xs font-medium text-indigo-300">{timer.running ? 'Resting' : 'Paused'}</p>
          <div className="flex flex-1 items-center justify-center gap-3">
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
          <button
            onClick={timer.reset}
            className="flex w-16 shrink-0 justify-end text-neutral-500 hover:text-neutral-300"
            aria-label="Cancel timer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-neutral-800">
          <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex gap-2">
          {pauseButton}
          {onGoNext && (
            <button
              onClick={onGoNext}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 py-2 text-xs font-semibold text-neutral-950 hover:bg-indigo-400"
            >
              <SkipForward size={13} /> Go next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
