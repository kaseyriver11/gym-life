import { ID_LABELS, slugsForExercise, type ExerciseLike } from './body-map'

export interface Workload {
  exerciseId: string
  exerciseName: string
  setCount: number
}

/** Per-region tally: a raw score (before clamping to the library's 0-10
 * intensity scale) plus which exercises contributed, for the tap-to-inspect
 * detail popover. `role` is set only by single-exercise callers (the Focus
 * view) where "primary vs secondary" is a real, exact categorization —
 * session/plan aggregation mixes multiple exercises' roles into one running
 * count per region, where a role label wouldn't mean anything, so those
 * callers leave it unset and get the numeric score instead. */
export interface MuscleLoad {
  score: number
  exercises: Set<string>
  role?: 'primary' | 'secondary'
}

/**
 * Aggregates workload into a per-region-id load map. Primary muscles count
 * every set; secondary/stabilizer muscles count every other set, landing at
 * roughly half weight without needing a fractional score.
 */
export function buildMuscleData(
  workload: Workload[],
  exercisesById: Map<string, ExerciseLike>,
): Map<string, MuscleLoad> {
  const loads = new Map<string, MuscleLoad>()
  function bump(id: string, exerciseName: string) {
    const existing = loads.get(id)
    if (existing) {
      existing.score += 1
      existing.exercises.add(exerciseName)
    } else {
      loads.set(id, { score: 1, exercises: new Set([exerciseName]) })
    }
  }

  for (const w of workload) {
    const info = exercisesById.get(w.exerciseId)
    if (!info) continue
    const { primary, secondary } = slugsForExercise(info)
    for (let i = 0; i < w.setCount; i++) {
      for (const id of primary) bump(id, w.exerciseName)
      if (i % 2 === 0) for (const id of secondary) bump(id, w.exerciseName)
    }
  }
  return loads
}

/** Friendly display name for a region id, e.g. "chest-upper-left" -> "Upper
 * Chest". Falls back to the raw id for anything not in the lookup. */
export function muscleLabel(id: string): string {
  return ID_LABELS[id] ?? id
}

/** The single most-worked muscle group in a load map, as a friendly label —
 * e.g. "Upper Chest" for an incline-press-heavy day. Null when nothing's
 * logged. Groups left/right (and, for chest/traps, upper/mid/lower) region
 * ids under their shared label before comparing.
 *
 * Compares the AVERAGE score per region within a label, not the sum — a
 * generic target like "Triceps Brachii" resolves to both heads (4 ids:
 * long/lateral x left/right) while a single chest sub-region resolves to
 * just 2 (upper x left/right), so summing would let triceps as a mere
 * secondary target out-score a genuinely primary chest sub-region purely
 * because it happens to cover more regions, not because it's worked harder.
 */
export function dominantMuscleLabel(loads: Map<string, MuscleLoad>): string | null {
  const totals = new Map<string, { sum: number; count: number }>()
  for (const [id, load] of loads) {
    const key = muscleLabel(id)
    const entry = totals.get(key)
    if (entry) {
      entry.sum += load.score
      entry.count += 1
    } else {
      totals.set(key, { sum: load.score, count: 1 })
    }
  }
  let best: string | null = null
  let bestAvg = 0
  for (const [key, { sum, count }] of totals) {
    const avg = sum / count
    if (avg > bestAvg) {
      best = key
      bestAvg = avg
    }
  }
  return best
}
