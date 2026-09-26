import { Plus } from 'lucide-react'
import { useState } from 'react'

/** Your own cues, shown on the exercise card while you log — tap them to
 * edit right there (one per line), or "+ cue" to add the first one. Saves
 * when you tap away. The catalog's form cues live in the Focus view, where
 * any of them can be pinned here. */
export function CardCues({ cues, onSave }: { cues?: string; onSave: (cues: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cues ?? '')
  const lines = (cues ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft.trim() !== (cues ?? '').trim()) onSave(draft.trim())
        }}
        rows={Math.max(2, draft.split('\n').length)}
        placeholder={'One cue per line, e.g.\nElbows tucked'}
        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] leading-snug text-neutral-100 outline-none focus:border-indigo-500"
      />
    )
  }

  if (lines.length === 0) {
    return (
      <button
        onClick={() => {
          setDraft('')
          setEditing(true)
        }}
        className="mt-0.5 flex items-center gap-0.5 text-[11px] text-neutral-600 hover:text-neutral-300"
      >
        <Plus size={11} /> cue
      </button>
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(cues ?? '')
        setEditing(true)
      }}
      className="mt-1 block w-full text-left"
      title="Tap to edit cues"
    >
      <ul className="space-y-0.5">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] leading-tight text-neutral-400">
            <span className="text-neutral-600">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
