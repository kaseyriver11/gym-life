interface ListColorStyle {
  border: string
  badge: string
  text: string
  dot: string
}

const PALETTE: ListColorStyle[] = [
  {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-500/20 text-indigo-300',
    text: 'text-indigo-400',
    dot: 'bg-indigo-500',
  },
  {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  {
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/20 text-amber-300',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  {
    border: 'border-l-rose-500',
    badge: 'bg-rose-500/20 text-rose-300',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  {
    border: 'border-l-cyan-500',
    badge: 'bg-cyan-500/20 text-cyan-300',
    text: 'text-cyan-400',
    dot: 'bg-cyan-500',
  },
  {
    border: 'border-l-violet-500',
    badge: 'bg-violet-500/20 text-violet-300',
    text: 'text-violet-400',
    dot: 'bg-violet-500',
  },
  {
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/20 text-orange-300',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
  },
  {
    border: 'border-l-teal-500',
    badge: 'bg-teal-500/20 text-teal-300',
    text: 'text-teal-400',
    dot: 'bg-teal-500',
  },
]

/** Deterministic color per list, so a list's accent stays stable across renders. */
export function listColorStyle(listId: string): ListColorStyle {
  let hash = 0
  for (let i = 0; i < listId.length; i++) {
    hash = (hash * 31 + listId.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
