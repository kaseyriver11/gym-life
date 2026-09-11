export const STANDARD_PLATES = [45, 35, 25, 10, 5, 2.5]
export const BAR_WEIGHTS = [45, 35, 0] as const

/** Greedy plate breakdown for one side of the bar. */
export function platesPerSide(
  totalWeight: number,
  barWeight: number,
  available: number[] = STANDARD_PLATES,
): number[] {
  let remaining = (totalWeight - barWeight) / 2
  if (!Number.isFinite(remaining) || remaining <= 0) return []

  const result: number[] = []
  for (const plate of available) {
    while (remaining >= plate - 0.001) {
      result.push(plate)
      remaining -= plate
    }
  }
  return result
}
