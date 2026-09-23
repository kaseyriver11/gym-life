import clsx from 'clsx'
import { ChevronDown, ChevronUp, Copy, Play, StretchHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BUILT_IN_ROUTINES } from './catalog-data/routines'
import { buildMuscleData } from './muscle-heat'
import { MuscleMapView } from './MuscleMapView'
import { useAllExercises } from './use-all-exercises'
import { useStartTemplate } from './use-start-template'
import { useWorkoutTemplates } from './use-workout-templates'

/** Built-in stretching/mobility routines on the Plan tab: start one as-is
 * (it lands in today's log as a block the sequence player can run), or
 * copy it into your saved workouts to tweak. */
export function MobilityRoutines({ onStarted }: { onStarted: () => void }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const { items: exercises } = useAllExercises()
  const { items: templates, add } = useWorkoutTemplates()
  const startTemplate = useStartTemplate()
  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  // Routines only work once the Mobility/Yoga catalog is in Firestore.
  const ready = BUILT_IN_ROUTINES.every((r) => r.template.entries.every((e) => exercisesById.has(e.exerciseId)))

  return (
    <div className="space-y-2">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <StretchHorizontal size={13} /> Mobility routines
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          {BUILT_IN_ROUTINES.length} built-in {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open &&
        BUILT_IN_ROUTINES.map(({ key, blurb, minutes, template }) => {
          const isOpen = expanded === key
          const alreadyCopied = copied === key || templates.some((t) => t.name === template.name)
          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 border-l-amber-600 bg-neutral-900"
            >
              <div className="flex items-center gap-2 p-3">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="flex min-w-0 flex-1 items-start gap-1.5 text-left"
                >
                  {isOpen ? (
                    <ChevronUp size={16} className="mt-0.5 shrink-0 text-neutral-600" />
                  ) : (
                    <ChevronDown size={16} className="mt-0.5 shrink-0 text-neutral-600" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {template.name} <span className="font-normal text-neutral-500">· ~{minutes} min</span>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{blurb}</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    startTemplate(template)
                    onStarted()
                  }}
                  disabled={!ready}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40"
                  aria-label={`Start "${template.name}"`}
                  title="Start"
                >
                  <Play size={14} />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-neutral-800 p-3">
                  <MuscleMapView
                    data={buildMuscleData(
                      template.entries.map((e) => ({
                        exerciseId: e.exerciseId,
                        exerciseName: e.exerciseName,
                        setCount: 1,
                      })),
                      exercisesById,
                    )}
                    size="6.5rem"
                  />
                  <ul className="mt-3 space-y-1.5">
                    {template.entries.map((e) => {
                      const perSide = exercisesById.get(e.exerciseId)?.perSide
                      return (
                        <li key={e.exerciseId} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-neutral-300">{e.exerciseName}</span>
                          <span className="shrink-0 text-neutral-500">
                            {e.plannedSets[0].durationSeconds}s{perSide ? ' each side' : ''}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    onClick={() => {
                      const now = Date.now()
                      add({ name: template.name, entries: template.entries, createdAt: now, updatedAt: now })
                      setCopied(key)
                    }}
                    disabled={alreadyCopied}
                    className={clsx(
                      'mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs',
                      alreadyCopied
                        ? 'border-neutral-800 text-neutral-600'
                        : 'border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-400',
                    )}
                  >
                    <Copy size={13} /> {alreadyCopied ? 'In your saved workouts' : 'Copy to my saved workouts to edit'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      {open && !ready && (
        <p className="text-[11px] text-amber-400">Mobility exercises are still loading — try again in a moment.</p>
      )}
    </div>
  )
}
