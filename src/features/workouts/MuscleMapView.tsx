import { BodyChart, INTENSITY_COLORS, MUSCLE_MAP, ViewSide, type BodyState } from 'body-muscles'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { dominantMuscleLabel, SCORE_SCALE, type MuscleLoad } from './muscle-heat'

const LEGEND_STEPS = [1, 3, 5, 7, 9]
const ID_TO_NAME = new Map(MUSCLE_MAP.map((m) => [m.id, m.name]))

function intensityColorFor(load: MuscleLoad | undefined): string | null {
  if (!load) return null
  return INTENSITY_COLORS[Math.max(1, Math.min(10, Math.round(load.score)))]
}

/** Appends an alpha channel to a "#rrggbb" hex color. */
function withAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

export function MuscleMapView({
  data,
  size = '9rem',
  unusedLabel = 'Not worked by this workout',
}: {
  data: Map<string, MuscleLoad>
  size?: string
  /** Shown in the tap-to-inspect box for a muscle with no load — callers
   * showing a single exercise (rather than a whole session) should pass
   * something like "Not worked by this exercise". */
  unusedLabel?: string
}) {
  const [selected, setSelected] = useState<{ id: string; label: string; exercises: string[] } | null>(
    null,
  )
  const [hover, setHover] = useState<{ label: string; detail: string | null; x: number; y: number } | null>(
    null,
  )
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

  const wrapperRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const frontChart = useRef<BodyChart | null>(null)
  const backChart = useRef<BodyChart | null>(null)
  const hoveredIdRef = useRef<string | null>(null)

  useEffect(() => {
    function handleClick(id: string, name: string) {
      const load = dataRef.current.get(id)
      setSelected({ id, label: name, exercises: load ? [...load.exercises] : [] })
    }
    function handleHover(id: string | null) {
      hoveredIdRef.current = id
      setHover((prev) => {
        if (!id) return null
        const name = ID_TO_NAME.get(id) ?? id
        const load = dataRef.current.get(id)
        // `measured` (single-exercise callers only) means this came from a
        // real per-exercise activationScore — show the actual percentage,
        // since it genuinely varies exercise to exercise. Unmeasured single-
        // exercise loads fall back to a flat per-role default, so a number
        // there would just be one of three hardcoded constants every time —
        // show the role instead. Session/plan callers leave both unset and
        // get the real, genuinely-varying accumulated score.
        const detail = !load
          ? null
          : load.measured
            ? `${Math.round((load.score / SCORE_SCALE) * 100)}% activation`
            : load.role === 'primary'
              ? 'Primary mover'
              : load.role === 'secondary'
                ? 'Secondary'
                : load.role === 'stabilizer'
                  ? 'Stabilizer'
                  : `${Math.max(1, Math.min(10, Math.round(load.score)))}/10 intensity`
        return prev ? { ...prev, label: name, detail } : { label: name, detail, x: 0, y: 0 }
      })
    }
    if (frontRef.current) {
      frontChart.current = new BodyChart(frontRef.current, {
        view: ViewSide.FRONT,
        bodyState,
        onMuscleClick: handleClick,
        onMuscleHover: handleHover,
        ariaLabel: 'Front muscle map',
      })
    }
    if (backRef.current) {
      backChart.current = new BodyChart(backRef.current, {
        view: ViewSide.BACK,
        bodyState,
        onMuscleClick: handleClick,
        onMuscleHover: handleHover,
        ariaLabel: 'Back muscle map',
      })
    }
    // The library's native <title> tooltip is slow to appear and can't be
    // themed (browser chrome, not page CSS) — strip it and drive our own
    // instantly-appearing, app-styled tooltip off onMuscleHover instead.
    wrapperRef.current?.querySelectorAll('title').forEach((el) => el.remove())
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
    // Re-strip any <title> elements the update re-render may have added.
    wrapperRef.current?.querySelectorAll('title').forEach((el) => el.remove())
  }, [bodyState])

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hoveredIdRef.current || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setHover((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev))
  }

  const dominant = dominantMuscleLabel(data)
  const selectedColor = selected ? intensityColorFor(dataRef.current.get(selected.id)) : null

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
      <div ref={wrapperRef} onMouseMove={handlePointerMove} className="relative">
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
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-center text-xs font-medium text-neutral-100 shadow-lg"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <div>{hover.label}</div>
            {hover.detail && <div className="text-[10px] font-normal text-neutral-400">{hover.detail}</div>}
          </div>
        )}
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
        <div
          className={clsx('rounded-lg p-2.5 text-center', !selectedColor && 'bg-neutral-800/70')}
          style={selectedColor ? { backgroundColor: withAlpha(selectedColor, 0.18) } : undefined}
        >
          <p
            className={clsx('text-sm font-semibold', !selectedColor && 'text-neutral-300')}
            style={selectedColor ? { color: selectedColor } : undefined}
          >
            {selected.label}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {selected.exercises.length > 0 ? selected.exercises.join(', ') : unusedLabel}
          </p>
        </div>
      )}
    </div>
  )
}
