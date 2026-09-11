export interface WarmupSet {
  weight: number
  reps: number
  label: string
}

const RAMP = [
  { pct: 0, reps: 8 },
  { pct: 0.4, reps: 5 },
  { pct: 0.6, reps: 3 },
  { pct: 0.8, reps: 2 },
]

/**
 * Suggests a ramp-up before a work weight, rounded to gym-loadable 5lb
 * steps. Skips any step that rounds to the bar or above the work weight —
 * light work weights naturally get a shorter ramp.
 */
export function warmupSets(workWeight: number, barWeight = 45): WarmupSet[] {
  if (workWeight <= barWeight) return []

  const seen = new Set<number>()
  const result: WarmupSet[] = []
  for (const step of RAMP) {
    const raw = step.pct === 0 ? barWeight : workWeight * step.pct
    const weight = Math.max(barWeight, Math.round(raw / 5) * 5)
    if (weight >= workWeight || seen.has(weight)) continue
    seen.add(weight)
    result.push({
      weight,
      reps: step.reps,
      label: weight === barWeight ? 'Bar' : `${Math.round((weight / workWeight) * 100)}%`,
    })
  }
  return result
}
