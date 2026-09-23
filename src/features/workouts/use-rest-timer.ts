import { useEffect, useRef, useState } from 'react'
import { cancelRestTimerAlert, scheduleRestTimerAlert } from '@/lib/notifications'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.5)
    oscillator.onended = () => ctx.close()
  } catch {
    // Web Audio unavailable — silently skip the beep.
  }
}

export const REST_PRESETS = [30, 60, 90, 120, 180]

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export type TimerMode = 'countdown' | 'stopwatch'

/**
 * Rest countdown + a stopwatch for timed sets (cardio, planks). Both are
 * driven by wall-clock timestamps rather than counting interval ticks:
 * Android pauses the WebView's timers while the screen is off, so a tick
 * counter silently loses however long the phone sat locked — a 30-minute
 * run timed with the screen off would come back reading a few seconds.
 * The interval below only refreshes the display; the truth is always
 * `endsAt` / `startedAt`.
 *
 * The end-of-rest alert is a scheduled system notification on Android (see
 * scheduleRestTimerAlert), since in-page beeps can't fire while suspended.
 * The in-page beep is only the fallback for web or a denied permission.
 */
export function useRestTimer(defaultSeconds = 90) {
  const [mode, setMode] = useState<TimerMode>('countdown')
  const [duration, setDuration] = useState(defaultSeconds)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState<string | null>(null)
  /** Countdown: when it hits zero (while running). */
  const [endsAt, setEndsAt] = useState(0)
  /** Stopwatch: when the current running stretch began. */
  const [startedAt, setStartedAt] = useState(0)
  /** Frozen value while paused/idle — seconds remaining (countdown) or
   * elapsed ms banked from earlier running stretches (stopwatch). */
  const [pausedRemaining, setPausedRemaining] = useState(0)
  const [bankedMs, setBankedMs] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  // Whether the OS notification is covering this countdown's end — if so,
  // don't also beep/vibrate in-page and double up the alert.
  const nativeAlertRef = useRef(false)
  // Bumped on every schedule/cancel so a slow schedule() that resolves
  // after the user already reset/paused can tell it's stale and undo itself.
  const alertGenRef = useRef(0)

  function armAlert(at: number) {
    const gen = ++alertGenRef.current
    nativeAlertRef.current = false
    scheduleRestTimerAlert(at).then((ok) => {
      if (gen !== alertGenRef.current) {
        if (ok) cancelRestTimerAlert()
        return
      }
      nativeAlertRef.current = ok
    })
  }

  function disarmAlert() {
    alertGenRef.current++
    nativeAlertRef.current = false
    cancelRestTimerAlert()
  }

  useEffect(() => {
    if (!running) return
    const refresh = () => {
      const t = Date.now()
      setNow(t)
      if (mode !== 'countdown' || t < endsAt) return
      setRunning(false)
      setPausedRemaining(0)
      // Only alert in-page if the finish is happening right now, while
      // we're watching — coming back to the app long after the OS
      // notification already went off shouldn't beep a second time.
      if (!nativeAlertRef.current && t - endsAt < 2000) {
        playBeep()
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      }
    }
    const interval = setInterval(refresh, 250)
    // Coming back from a locked screen: show the true time immediately
    // rather than waiting for the next (possibly throttled) tick.
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [running, mode, endsAt])

  const remaining =
    mode === 'countdown'
      ? running
        ? Math.max(0, Math.ceil((endsAt - now) / 1000))
        : pausedRemaining
      : 0
  const elapsed =
    mode === 'stopwatch' ? Math.floor((bankedMs + (running ? now - startedAt : 0)) / 1000) : 0

  function start(seconds?: number) {
    const s = seconds ?? duration
    const t = Date.now()
    setMode('countdown')
    setDuration(s)
    setEndsAt(t + s * 1000)
    setNow(t)
    setPausedRemaining(s)
    setBankedMs(0)
    setLabel(null)
    setRunning(true)
    armAlert(t + s * 1000)
  }

  function startStopwatch(newLabel?: string) {
    const t = Date.now()
    disarmAlert()
    setMode('stopwatch')
    setPausedRemaining(0)
    setBankedMs(0)
    setStartedAt(t)
    setNow(t)
    setLabel(newLabel ?? null)
    setRunning(true)
  }

  function pause() {
    if (!running) return
    const t = Date.now()
    if (mode === 'countdown') {
      setPausedRemaining(Math.max(0, Math.ceil((endsAt - t) / 1000)))
      disarmAlert()
    } else {
      setBankedMs((b) => b + (t - startedAt))
    }
    setRunning(false)
  }

  function resume() {
    const t = Date.now()
    setNow(t)
    if (mode === 'stopwatch') {
      setStartedAt(t)
      setRunning(true)
    } else if (pausedRemaining > 0) {
      setEndsAt(t + pausedRemaining * 1000)
      setRunning(true)
      armAlert(t + pausedRemaining * 1000)
    }
  }

  function reset() {
    if (mode === 'countdown') disarmAlert()
    setRunning(false)
    setPausedRemaining(0)
    setBankedMs(0)
    setLabel(null)
  }

  function addSeconds(delta: number) {
    if (mode !== 'countdown') return
    if (running) {
      const next = Math.max(Date.now(), endsAt + delta * 1000)
      setEndsAt(next)
      armAlert(next)
    } else {
      setPausedRemaining((r) => Math.max(0, r + delta))
    }
  }

  const idle = !running && remaining === 0 && elapsed === 0

  return {
    mode,
    duration,
    remaining,
    elapsed,
    running,
    idle,
    label,
    start,
    startStopwatch,
    pause,
    resume,
    reset,
    addSeconds,
  }
}

export type RestTimer = ReturnType<typeof useRestTimer>
