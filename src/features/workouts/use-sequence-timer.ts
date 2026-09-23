import { useEffect, useRef, useState } from 'react'

export interface SequenceStep {
  label: string
  holdSeconds: number
  /** Rest/transition after this step — 0 skips straight to the next hold. */
  restSeconds: number
}

export type SequencePhase = 'hold' | 'rest' | 'done'

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

/**
 * Plays back an ordered list of timed steps hands-free — "1 min pose X, 15s
 * rest, 1 min pose Y, 15s rest, ..." — auto-advancing hold → rest → next
 * pose's hold without waiting for the user to tap anything. Deliberately not
 * built on useRestTimer: that hook drives the shared strength rest-timer bar
 * used elsewhere in the same session, and conflating the two would mean a
 * sequence in progress and a between-sets rest could stomp on each other's
 * state. This is a small, self-contained state machine instead.
 *
 * Reads current steps/stepIndex/phase/remaining via refs inside the ticking
 * interval rather than state, so the single `setInterval` set up when
 * `running` turns true never needs to be torn down and recreated just
 * because a step advanced — it always sees the latest values without a
 * stale closure.
 */
export function useSequenceTimer(onHoldComplete?: (stepIndex: number, actualSeconds: number) => void) {
  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState<SequencePhase>('done')
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)

  const stepsRef = useRef(steps)
  const stepIndexRef = useRef(stepIndex)
  const phaseRef = useRef(phase)
  const remainingRef = useRef(remaining)
  const onHoldCompleteRef = useRef(onHoldComplete)
  stepsRef.current = steps
  stepIndexRef.current = stepIndex
  phaseRef.current = phase
  remainingRef.current = remaining
  onHoldCompleteRef.current = onHoldComplete

  /** The current phase just hit zero — move to whatever's next: hold with
   * rest configured -> that rest; hold with no rest, or a finished rest ->
   * the next step's hold; last step -> done. */
  function advance() {
    const currentSteps = stepsRef.current
    const currentIndex = stepIndexRef.current
    const currentPhase = phaseRef.current
    playBeep()
    if (navigator.vibrate) navigator.vibrate(150)

    if (currentPhase === 'hold') {
      const planned = currentSteps[currentIndex]?.holdSeconds ?? 0
      // remainingRef is 0 on a natural zero-crossing (the full hold was
      // actually held) but still has leftover seconds when advance() was
      // called via skip() instead — log what was really held, not what was
      // planned.
      const actualHeld = Math.max(0, planned - remainingRef.current)
      onHoldCompleteRef.current?.(currentIndex, actualHeld)
      const hasNextStep = currentIndex + 1 < currentSteps.length
      const restSeconds = currentSteps[currentIndex]?.restSeconds ?? 0
      // No rest after the last pose — there's nothing left to transition
      // into, so a trailing countdown would just be a dead end.
      if (hasNextStep && restSeconds > 0) {
        setPhase('rest')
        setRemaining(restSeconds)
        return
      }
    }
    const nextIndex = currentIndex + 1
    if (nextIndex >= currentSteps.length) {
      setRunning(false)
      setPhase('done')
      setRemaining(0)
      return
    }
    setStepIndex(nextIndex)
    setPhase('hold')
    setRemaining(currentSteps[nextIndex].holdSeconds)
  }

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      if (remainingRef.current > 1) {
        setRemaining((r) => r - 1)
      } else {
        // The final second has now fully elapsed — zero the ref before
        // advance() reads it, so a natural completion logs the whole
        // planned duration rather than one second short.
        remainingRef.current = 0
        advance()
      }
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function start(newSteps: SequenceStep[]) {
    if (newSteps.length === 0) return
    setSteps(newSteps)
    setStepIndex(0)
    setPhase('hold')
    setRemaining(newSteps[0].holdSeconds)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function resume() {
    if (phase !== 'done') setRunning(true)
  }

  function stop() {
    setRunning(false)
    setPhase('done')
    setRemaining(0)
    setSteps([])
    setStepIndex(0)
  }

  /** Jumps straight to the next phase (skip the rest of a hold, or skip a
   * rest) — same end state a natural zero-crossing would produce. */
  function skip() {
    if (phase === 'done') return
    advance()
  }

  return {
    steps,
    stepIndex,
    phase,
    remaining,
    running,
    active: phase !== 'done',
    currentLabel: steps[stepIndex]?.label,
    nextLabel: steps[stepIndex + 1]?.label,
    start,
    pause,
    resume,
    stop,
    skip,
  }
}

export type SequenceTimer = ReturnType<typeof useSequenceTimer>
