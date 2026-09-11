export const EQUIPMENT_TYPES = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Bands',
  'Other',
] as const

export type Equipment = (typeof EQUIPMENT_TYPES)[number]

export const EQUIPMENT_ICONS: Record<Equipment, string> = {
  Barbell: '🏋️',
  Dumbbell: '💪',
  Kettlebell: '🔔',
  Machine: '⚙️',
  Cable: '🔗',
  Bodyweight: '🤸',
  Bands: '➰',
  Other: '❓',
}
