import { Plus } from 'lucide-react'
import { useState } from 'react'
import { inputClass } from '@/components/form'
import { useExercises } from './use-exercises'

export function ExercisesTab() {
  const { items, add, remove } = useExercises()
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await add({
      name: name.trim(),
      muscleGroup: muscleGroup.trim() || undefined,
      createdAt: Date.now(),
    })
    setName('')
    setMuscleGroup('')
  }

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          placeholder="Exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Muscle group"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className={`${inputClass} max-w-32`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500"
          aria-label="Add exercise"
        >
          <Plus size={18} />
        </button>
      </form>

      <ul className="space-y-2">
        {sorted.map((exercise) => (
          <li
            key={exercise.id}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-3"
          >
            <div>
              <p className="text-sm text-neutral-100">{exercise.name}</p>
              {exercise.muscleGroup && (
                <p className="text-xs text-neutral-500">{exercise.muscleGroup}</p>
              )}
            </div>
            <button
              onClick={() => remove(exercise.id)}
              className="text-xs text-neutral-600 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">
            No exercises yet — add the ones you train regularly.
          </p>
        )}
      </ul>
    </div>
  )
}
