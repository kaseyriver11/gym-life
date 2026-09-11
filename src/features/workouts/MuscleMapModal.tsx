import Model, { type IExerciseData } from 'react-body-highlighter'
import { Modal } from '@/components/Modal'
import { MUSCLE_HEAT_COLORS } from './muscle-heat'

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
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No sets to show yet — this fills in as sets are logged or planned.
        </p>
      ) : (
        <div className="flex items-start justify-center gap-6">
          <div className="text-center">
            <Model
              data={data}
              type="anterior"
              highlightedColors={MUSCLE_HEAT_COLORS}
              bodyColor="#3f3f46"
              style={{ width: '9rem' }}
            />
            <p className="mt-1 text-xs text-neutral-500">Front</p>
          </div>
          <div className="text-center">
            <Model
              data={data}
              type="posterior"
              highlightedColors={MUSCLE_HEAT_COLORS}
              bodyColor="#3f3f46"
              style={{ width: '9rem' }}
            />
            <p className="mt-1 text-xs text-neutral-500">Back</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
