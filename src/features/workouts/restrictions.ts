import { format } from 'date-fns'

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export const RESTRICTION_DURATIONS = [
  { value: '1', label: '1 month' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
  { value: 'forever', label: 'Forever' },
] as const

export function restrictedUntilFromMonths(months: string): string {
  if (months === 'forever') return 'forever'
  const d = new Date()
  d.setMonth(d.getMonth() + Number(months))
  return format(d, 'yyyy-MM-dd')
}

/** True while an exercise's restriction is still in effect — a past
 * expiry date means the restriction lapsed and the exercise is available
 * again without the user needing to manually clear it. */
export function isRestricted(restrictedUntil?: string | null): boolean {
  if (!restrictedUntil) return false
  if (restrictedUntil === 'forever') return true
  return restrictedUntil >= todayISO()
}

export function restrictionLabel(restrictedUntil?: string | null): string | null {
  if (!isRestricted(restrictedUntil)) return null
  if (restrictedUntil === 'forever') return 'Off-limits indefinitely'
  return `Off-limits until ${format(new Date(`${restrictedUntil}T00:00:00`), 'MMM d, yyyy')}`
}
