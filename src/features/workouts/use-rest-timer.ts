import { useEffect, useState } from 'react'

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

export function useRestTimer(defaultSeconds = 90) {
  const [mode, setMode] = useState<TimerMode>('countdown')
  const [duration, setDuration] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsed((e) => e + 1)
        return
      }
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          playBeep()
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, mode])

  function start(seconds?: number) {
    const s = seconds ?? duration
    setMode('countdown')
    setDuration(s)
    setRemaining(s)
    setElapsed(0)
    setLabel(null)
    setRunning(true)
  }

  function startStopwatch(newLabel?: string) {
    setMode('stopwatch')
    setRemaining(0)
    setElapsed(0)
    setLabel(newLabel ?? null)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function resume() {
    if (mode === 'stopwatch' || remaining > 0) setRunning(true)
  }

  function reset() {
    setRunning(false)
    setRemaining(0)
    setElapsed(0)
    setLabel(null)
  }

  function addSeconds(delta: number) {
    if (mode !== 'countdown') return
    setRemaining((r) => Math.max(0, r + delta))
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
