export interface TimedSession {
  createdAt: number
  endedAt?: number
  /** Set when the user removed the elapsed-time tracker — no live clock,
   * and nothing to show/use unless a manual duration was also entered. */
  noTimer?: boolean
  /** A hand-entered duration — set when someone corrects a bad clock
   * (accidentally cleared, forgot to time from the start, etc.) or skipped
   * timing entirely and typed the number in after the fact. Always wins
   * over the live clock when present. */
  durationOverrideSeconds?: number
  /** When the clock was paused, while it still is. */
  pausedAt?: number
  /** Total ms spent paused in earlier, already-resumed pauses. */
  pausedMs?: number
}

/**
 * The duration to show and use for this session. A manual entry always
 * wins — it's the user overriding or supplying what the clock couldn't.
 * Otherwise it's the live createdAt→endedAt/now span minus any time spent
 * paused, or null when timing was turned off and nothing was entered by
 * hand (nothing to show yet).
 */
export function effectiveDurationSeconds(session: TimedSession, nowMs: number): number | null {
  if (session.durationOverrideSeconds != null) return session.durationOverrideSeconds
  if (session.noTimer) return null
  const end = session.endedAt ?? session.pausedAt ?? nowMs
  return Math.max(0, Math.floor((end - session.createdAt - (session.pausedMs ?? 0)) / 1000))
}

/** Patch that stops the clock now. */
export function pausePatch(nowMs: number): Partial<TimedSession> {
  return { pausedAt: nowMs }
}

/** Patch that restarts a paused clock, banking the time spent paused. */
export function resumePatch(session: TimedSession, nowMs: number): Partial<TimedSession> {
  if (session.pausedAt == null) return {}
  return { pausedAt: undefined, pausedMs: (session.pausedMs ?? 0) + Math.max(0, nowMs - session.pausedAt) }
}
