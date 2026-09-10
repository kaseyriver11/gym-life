import { useUserCollection } from '@/lib/use-collection'
import type { HealthSnapshot } from '@/types'

export function useHealthSnapshots() {
  return useUserCollection<HealthSnapshot>('healthSnapshots')
}
