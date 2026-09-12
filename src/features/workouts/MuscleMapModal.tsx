import type { IExerciseData } from 'react-body-highlighter'
import { Modal } from '@/components/Modal'
import { MuscleMapView } from './MuscleMapView'

export function MuscleMapModal({
  title,
  data,
  onClose,
}: {
  title: string
  data: IExerciseData[]
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <MuscleMapView data={data} />
    </Modal>
  )
}
