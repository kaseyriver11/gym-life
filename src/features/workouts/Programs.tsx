import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Check,
  ChevronRight,
  Pencil,
  Play,
  Plus,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { Program, WorkoutTemplate } from '@/types'
import { useActiveProgram, type ProgramDraft, type ProgramProgress } from './use-programs'
import { useWorkoutTemplates } from './use-workout-templates'

function weekLabel(program: Program, progress: ProgramProgress) {
  return program.lengthWeeks
    ? `Week ${Math.min(progress.week, program.lengthWeeks)} of ${program.lengthWeeks}`
    : `Week ${progress.week}`
}

/** Compact card for Home: what's next in the active program, one tap to
 * start it (or continue it, if today's session already has it). */
export function NextUpCard() {
  const { active, progress, templatesById, startTemplate } = useActiveProgram()
  const [starting, setStarting] = useState(false)
  if (!active || !progress || active.slots.length === 0) return null

  const slot = active.slots[progress.nextIndex]
  const template = templatesById.get(slot.templateId)
  const inToday = progress.todaySlots.includes(progress.nextIndex)

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-indigo-300">
          {active.name} · {weekLabel(active, progress)}
        </p>
        <Link
          to="/workouts"
          state={{ tab: 'plan' }}
          className="flex shrink-0 items-center text-xs text-neutral-400 hover:text-neutral-200"
        >
          Program <ChevronRight size={14} />
        </Link>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Next up</p>
          <p className="truncate text-lg font-semibold text-neutral-50">{template?.name ?? slot.templateName}</p>
        </div>
        {inToday ? (
          <Link
            to="/workouts"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Continue
          </Link>
        ) : (
          template && (
            <Link
              to="/workouts"
              onClick={() => {
                if (starting) return
                setStarting(true)
                startTemplate(template)
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Play size={14} /> Start
            </Link>
          )
        )}
      </div>
    </div>
  )
}

/** The Programs block at the top of the Plan tab. */
export function ProgramsSection({ onStarted }: { onStarted: () => void }) {
  const ctx = useActiveProgram()
  const { programs, active, progress, templatesById } = ctx
  const { items: templates } = useWorkoutTemplates()
  const [editing, setEditing] = useState<Program | 'new' | null>(null)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <CalendarRange size={13} /> Program
        </p>
        <button
          onClick={() => setEditing('new')}
          disabled={templates.length === 0}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-indigo-400 disabled:opacity-40"
        >
          <Plus size={13} /> New program
        </button>
      </div>

      {active && progress ? (
        <ActiveProgramCard
          program={active}
          progress={progress}
          templatesById={templatesById}
          onStart={(t) => {
            ctx.startTemplate(t)
            onStarted()
          }}
          onSetNext={ctx.setNext}
          onEdit={() => setEditing(active)}
          onEnd={() => ctx.deactivate(active.id)}
          onRestart={() => ctx.activate(active.id)}
        />
      ) : programs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-3 py-3 text-xs text-neutral-500">
          {templates.length < 2
            ? 'Save a couple of workouts below, then line them up into a program — e.g. Push → Pull → Legs — and the app keeps track of what\'s next.'
            : 'Line your saved workouts up into a rotation — e.g. Push → Pull → Legs — and the app keeps track of what\'s next.'}
        </p>
      ) : null}

      {programs
        .filter((p) => !p.active)
        .map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-200">{p.name}</p>
              <p className="truncate text-xs text-neutral-500">
                {p.slots.map((s) => templatesById.get(s.templateId)?.name ?? s.templateName).join(' → ')}
              </p>
            </div>
            <button onClick={() => setEditing(p)} className="text-neutral-500 hover:text-indigo-400" aria-label="Edit program">
              <Pencil size={14} />
            </button>
            <button onClick={() => ctx.remove(p.id)} className="text-neutral-500 hover:text-red-400" aria-label="Delete program">
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => ctx.activate(p.id)}
              className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-indigo-600"
            >
              Start
            </button>
          </div>
        ))}

      {editing && (
        <ProgramBuilder
          existing={editing === 'new' ? undefined : editing}
          templates={templates}
          onClose={() => setEditing(null)}
          onDelete={
            editing !== 'new'
              ? () => {
                  ctx.remove(editing.id)
                  setEditing(null)
                }
              : undefined
          }
          onSave={(draft) => {
            if (editing === 'new') ctx.create(draft)
            else ctx.save(editing.id, draft)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ActiveProgramCard({
  program,
  progress,
  templatesById,
  onStart,
  onSetNext,
  onEdit,
  onEnd,
  onRestart,
}: {
  program: Program
  progress: ProgramProgress
  templatesById: Map<string, WorkoutTemplate>
  onStart: (t: WorkoutTemplate) => void
  onSetNext: (index: number) => void
  onEdit: () => void
  onEnd: () => void
  onRestart: () => void
}) {
  const n = program.slots.length
  const next = program.slots[progress.nextIndex]
  const nextTemplate = next && templatesById.get(next.templateId)
  const inToday = progress.todaySlots.includes(progress.nextIndex)

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-500/30 bg-neutral-900">
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-100">{program.name}</p>
          <p className="text-xs text-neutral-500">
            {weekLabel(program, progress)} · {progress.doneCount} workout{progress.doneCount === 1 ? '' : 's'} done ·
            started {format(parseISO(program.startDate), 'MMM d')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <button onClick={onEdit} className="text-neutral-500 hover:text-indigo-400" aria-label="Edit program">
            <Pencil size={14} />
          </button>
          <button onClick={onEnd} className="text-xs text-neutral-500 hover:text-red-400">
            End
          </button>
        </div>
      </div>

      {progress.finished && (
        <div className="flex items-center justify-between gap-2 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <span>{program.lengthWeeks}-week block complete.</span>
          <button onClick={onRestart} className="font-medium underline-offset-2 hover:underline">
            Run it again
          </button>
        </div>
      )}

      {n === 0 ? (
        <p className="px-3 py-3 text-xs text-neutral-500">No workouts in this program yet — edit it to add some.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Next up</p>
              <p className="truncate text-base font-semibold text-neutral-50">
                {nextTemplate?.name ?? `${next.templateName} (deleted)`}
              </p>
            </div>
            <button
              onClick={() => onSetNext((progress.nextIndex + 1) % n)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
              title="Skip to the following workout"
            >
              <SkipForward size={14} /> Skip
            </button>
            {inToday ? (
              <span className="rounded-full bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300">In today's log</span>
            ) : (
              <button
                onClick={() => nextTemplate && onStart(nextTemplate)}
                disabled={!nextTemplate}
                className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                <Play size={13} /> Start
              </button>
            )}
          </div>

          <ol className="border-t border-neutral-800 px-1.5 py-1.5">
            {program.slots.map((slot, i) => {
              const isNext = i === progress.nextIndex
              const last = progress.lastDoneBySlot[i]
              const t = templatesById.get(slot.templateId)
              return (
                <li key={`${slot.templateId}-${i}`}>
                  <button
                    onClick={() => !isNext && onSetNext(i)}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left',
                      isNext ? 'bg-indigo-500/10' : 'hover:bg-neutral-800/60',
                    )}
                    title={isNext ? undefined : 'Do this one next'}
                  >
                    <span
                      className={clsx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                        isNext ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={clsx('min-w-0 flex-1 truncate text-sm', isNext ? 'text-neutral-100' : 'text-neutral-400')}>
                      {t?.name ?? `${slot.templateName} (deleted)`}
                    </span>
                    {last && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500">
                        <Check size={11} className="text-emerald-500" /> {format(parseISO(last), 'MMM d')}
                      </span>
                    )}
                    {isNext && <span className="shrink-0 text-[11px] font-medium text-indigo-300">Next</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="px-3 pb-2.5 text-[11px] text-neutral-600">
            Tap any workout to make it next. The rotation moves forward as you log — missed days don't break it.
          </p>
        </>
      )}
    </div>
  )
}

function ProgramBuilder({
  existing,
  templates,
  onClose,
  onSave,
  onDelete,
}: {
  existing?: Program
  templates: WorkoutTemplate[]
  onClose: () => void
  onSave: (draft: ProgramDraft) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [slots, setSlots] = useState<Program['slots']>(existing?.slots ?? [])
  const [weeks, setWeeks] = useState(existing?.lengthWeeks?.toString() ?? '')
  const templatesById = new Map(templates.map((t) => [t.id, t]))

  function move(i: number, delta: number) {
    setSlots((prev) => {
      const next = [...prev]
      const j = i + delta
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const lengthWeeks = Number(weeks) > 0 ? Math.round(Number(weeks)) : undefined
  const canSave = name.trim().length > 0 && slots.length > 0

  return (
    <Modal title={existing ? 'Edit program' : 'New program'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PPL — fall block"
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1 text-xs text-neutral-500">Rotation — done in this order, then repeats</p>
          {slots.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-700 px-3 py-3 text-center text-xs text-neutral-500">
              Add saved workouts below.
            </p>
          )}
          <ol className="space-y-1.5">
            {slots.map((slot, i) => (
              <li key={`${slot.templateId}-${i}`} className="flex items-center gap-2 rounded-lg bg-neutral-800 px-2.5 py-2">
                <span className="w-4 shrink-0 text-xs text-neutral-500">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">
                  {templatesById.get(slot.templateId)?.name ?? `${slot.templateName} (deleted)`}
                </span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === slots.length - 1}
                  className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => setSlots((prev) => prev.filter((_, k) => k !== i))}
                  className="text-neutral-500 hover:text-red-400"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ol>
          <select
            value=""
            onChange={(e) => {
              const t = templatesById.get(e.target.value)
              if (t) setSlots((prev) => [...prev, { templateId: t.id, templateName: t.name }])
            }}
            className={`${inputClass} mt-2`}
          >
            <option value="">+ Add a saved workout…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-500">Length in weeks (optional)</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            placeholder="Ongoing"
            className={`${inputClass} w-32`}
          />
        </div>

        <button
          onClick={() => canSave && onSave({ name: name.trim(), slots, lengthWeeks })}
          disabled={!canSave}
          className={primaryButtonClass}
        >
          {existing ? 'Save program' : 'Create program'}
        </button>
        {onDelete && (
          <button onClick={onDelete} className="w-full text-center text-xs text-neutral-500 hover:text-red-400">
            Delete program
          </button>
        )}
      </div>
    </Modal>
  )
}
