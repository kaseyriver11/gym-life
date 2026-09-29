/**
 * Other names people use for catalog exercises whose own name doesn't say
 * what they are — searched along with the real name, never shown.
 */
const ALIASES: Record<string, string> = {
  'Seal Row': 'chest supported barbell row prone bench',
  'Kroc Row': 'heavy dumbbell one arm row',
  'Pendlay Row (Barbell)': 'dead stop row',
  'Meadows Row (Landmine)': 'one arm landmine row',
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Whether an exercise matches a search. Word-based, so punctuation and
 * word order don't matter: "chest supported row", "row chest-supported" and
 * "supp row db" style partial words all find "Chest-Supported Row
 * (Dumbbell)". Equipment and aliases count too ("row barbell chest" finds
 * Seal Row). Every typed word has to start some word of the exercise.
 */
export function matchesExerciseSearch(
  exercise: { name: string; equipment?: string },
  query: string,
): boolean {
  const wanted = words(query)
  if (wanted.length === 0) return true
  const haystack = words(`${exercise.name} ${exercise.equipment ?? ''} ${ALIASES[exercise.name] ?? ''}`)
  return wanted.every((w) => haystack.some((h) => h.startsWith(w)))
}
