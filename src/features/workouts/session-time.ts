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
}

/**
 * The duration to show and use for this session. A manual entry always
 * wins — it's the user overriding or supplying what the clock couldn't.
 * Otherwise it's the live createdAt→endedAt/now span, or null when timing
 * was turned off and nothing was entered by hand (nothing to show yet).
 */
export function effectiveDurationSeconds(session: TimedSession, nowMs: number): number | null {
  if (session.durationOverrideSeconds != null) return session.durationOverrideSeconds
  if (session.noTimer) return null
  return Math.max(0, Math.floor(((session.endedAt ?? nowMs) - session.createdAt) / 1000))
}
