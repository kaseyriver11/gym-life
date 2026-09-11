// 0=Sun..6=Sat, matching JS Date#getDay().
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function weekdayOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}
