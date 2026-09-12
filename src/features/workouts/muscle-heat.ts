import { ID_LABELS, slugsForExercise, type ExerciseLike } from './body-map'

export interface Workload {
  exerciseId: string
  exerciseName: string
  setCount: number
}

/** Per-region tally: a raw score (before clamping to the library's 0-10
 * intensity scale) plus which exercises contributed, for the tap-to-inspect
 * detail popover. */
export interface MuscleLoad {
  score: number
  exercises: Set<string>
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
 * ids under their shared label before comparing totals. */
export function dominantMuscleLabel(loads: Map<string, MuscleLoad>): string | null {
  const totals = new Map<string, number>()
  for (const [id, load] of loads) {
    const key = muscleLabel(id)
    totals.set(key, (totals.get(key) ?? 0) + load.score)
  }
  let best: string | null = null
  let bestScore = 0
  for (const [key, score] of totals) {
    if (score > bestScore) {
      best = key
      bestScore = score
    }
  }
  return best
}
