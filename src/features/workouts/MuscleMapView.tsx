import { BodyChart, INTENSITY_COLORS, ViewSide, type BodyState } from 'body-muscles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { dominantMuscleLabel, type MuscleLoad } from './muscle-heat'

const LEGEND_STEPS = [1, 3, 5, 7, 9]

export function MuscleMapView({
  data,
  size = '9rem',
}: {
  data: Map<string, MuscleLoad>
  size?: string
}) {
  const [selected, setSelected] = useState<{ label: string; exercises: string[] } | null>(null)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const bodyState = useMemo(() => {
    const state: BodyState = {}
    for (const [id, load] of data) {
      state[id] = { intensity: Math.max(1, Math.min(10, Math.round(load.score))), selected: false }
    }
    return state
  }, [data])

  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const frontChart = useRef<BodyChart | null>(null)
  const backChart = useRef<BodyChart | null>(null)

  useEffect(() => {
    function handleClick(id: string, name: string) {
      const load = dataRef.current.get(id)
      setSelected({ label: name, exercises: load ? [...load.exercises] : [] })
    }
    if (frontRef.current) {
      frontChart.current = new BodyChart(frontRef.current, {
        view: ViewSide.FRONT,
        bodyState,
        onMuscleClick: handleClick,
        ariaLabel: 'Front muscle map',
      })
    }
    if (backRef.current) {
      backChart.current = new BodyChart(backRef.current, {
        view: ViewSide.BACK,
        bodyState,
        onMuscleClick: handleClick,
        ariaLabel: 'Back muscle map',
      })
    }
    return () => {
      frontChart.current?.destroy()
      backChart.current?.destroy()
      frontChart.current = null
      backChart.current = null
    }
    // Mount/unmount only — bodyState updates flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    frontChart.current?.update({ bodyState })
    backChart.current?.update({ bodyState })
  }, [bodyState])

  const dominant = dominantMuscleLabel(data)

  if (data.size === 0) {
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
          <div ref={frontRef} style={{ width: size }} />
          <p className="mt-1 text-xs text-neutral-500">Front</p>
        </div>
        <div className="text-center">
          <div ref={backRef} style={{ width: size }} />
          <p className="mt-1 text-xs text-neutral-500">Back</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="text-[10px] text-neutral-600">Light</span>
        <div className="flex h-2 overflow-hidden rounded-full">
          {LEGEND_STEPS.map((step) => (
            <span key={step} className="h-full w-4" style={{ backgroundColor: INTENSITY_COLORS[step] }} />
          ))}
        </div>
        <span className="text-[10px] text-neutral-600">Heavy</span>
      </div>
      <p className="text-center text-[10px] text-neutral-600">Tap any muscle for details</p>
      {selected && (
        <div className="rounded-lg bg-neutral-800/70 p-2.5 text-center">
          <p className="text-sm font-medium text-teal-300">{selected.label}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {selected.exercises.length > 0
              ? selected.exercises.join(', ')
              : 'Not worked by this workout'}
          </p>
        </div>
      )}
    </div>
  )
}
