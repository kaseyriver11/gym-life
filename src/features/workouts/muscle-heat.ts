import type { IExerciseData } from 'react-body-highlighter'
import { slugsForExercise, type ExerciseLike } from './body-map'

/** Green -> red, 8 steps. react-body-highlighter clamps to the last color
 * once frequency exceeds this length, so it never errors on a big day. */
export const MUSCLE_HEAT_COLORS = [
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#dc2626',
  '#991b1b',
]

export interface Workload {
  exerciseId: string
  exerciseName: string
  setCount: number
}

/**
 * One data entry per set (the library sums `frequency` across entries
 * sharing a muscle, defaulting to 1 each) — so more sets naturally reads as
 * "more red". Secondary/stabilizer muscles only count on every other set,
 * landing at roughly half weight without ever needing a fractional
 * frequency (which the library can't use as a color-array index).
 */
export function buildMuscleData(
  workload: Workload[],
  exercisesById: Map<string, ExerciseLike>,
): IExerciseData[] {
  const data: IExerciseData[] = []
  for (const w of workload) {
    const info = exercisesById.get(w.exerciseId)
    if (!info) continue
    const { primary, secondary } = slugsForExercise(info)
    for (let i = 0; i < w.setCount; i++) {
      if (primary.length > 0) data.push({ name: w.exerciseName, muscles: primary })
      if (secondary.length > 0 && i % 2 === 0) {
        data.push({ name: w.exerciseName, muscles: secondary })
      }
    }
  }
  return data
}
