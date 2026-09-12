import { useState } from 'react'
import Model, { type IExerciseData, type IMuscleStats } from 'react-body-highlighter'
import { dominantMuscleLabel, muscleLabel, MUSCLE_HEAT_COLORS } from './muscle-heat'

export function MuscleMapView({
  data,
  size = '9rem',
}: {
  data: IExerciseData[]
  size?: string
}) {
  const [selected, setSelected] = useState<{
    label: string
    exercises: string[]
  } | null>(null)

  const dominant = dominantMuscleLabel(data)

  function handleClick({ muscle, data: stats }: IMuscleStats) {
    if (stats.frequency === 0) return
    setSelected({ label: muscleLabel(muscle), exercises: [...new Set(stats.exercises)] })
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No sets to show yet — this fills in as sets are logged or planned.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {dominant && (
        <p className="text-center text-xs text-neutral-500">
          <span className="font-medium text-neutral-300">{dominant}</span>-dominant
        </p>
      )}
      <div className="flex items-start justify-center gap-6">
        <div className="text-center">
          <Model
            data={data}
            type="anterior"
            highlightedColors={MUSCLE_HEAT_COLORS}
            bodyColor="#3f3f46"
            style={{ width: size }}
            onClick={handleClick}
          />
          <p className="mt-1 text-xs text-neutral-500">Front</p>
        </div>
        <div className="text-center">
          <Model
            data={data}
            type="posterior"
            highlightedColors={MUSCLE_HEAT_COLORS}
            bodyColor="#3f3f46"
            style={{ width: size }}
            onClick={handleClick}
          />
          <p className="mt-1 text-xs text-neutral-500">Back</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="text-[10px] text-neutral-600">Light</span>
        <div className="flex h-2 overflow-hidden rounded-full">
          {MUSCLE_HEAT_COLORS.map((color) => (
            <span key={color} className="h-full w-4" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-[10px] text-neutral-600">Heavy</span>
      </div>
      <p className="text-center text-[10px] text-neutral-600">Tap a colored muscle for details</p>
      {selected && (
        <div className="rounded-lg bg-neutral-800/70 p-2.5 text-center">
          <p className="text-sm font-medium text-teal-300">{selected.label}</p>
          <p className="mt-0.5 text-xs text-neutral-400">{selected.exercises.join(', ')}</p>
        </div>
      )}
    </div>
  )
}
