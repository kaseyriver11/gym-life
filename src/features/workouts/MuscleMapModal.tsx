import { Modal } from '@/components/Modal'
import { MuscleMapView } from './MuscleMapView'
import type { MuscleLoad } from './muscle-heat'

export function MuscleMapModal({
  title,
  data,
  onClose,
}: {
  title: string
  data: Map<string, MuscleLoad>
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <MuscleMapView data={data} />
    </Modal>
  )
}
