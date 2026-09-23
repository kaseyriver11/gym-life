import type { Exercise, MuscleTarget } from '@/types'

/**
 * Mobility: static stretches, mobility drills and foam rolling — logged as
 * timed holds, same as Yoga (see isHoldBased). `targetMuscles` here means
 * the area stretched/mobilized/rolled rather than worked, so the muscle map
 * shows where a routine is aimed. `perSide` entries log as left/right pairs
 * and progress each side separately.
 */

function targets(primary: string[], secondary: string[] = []): MuscleTarget[] {
  return [
    ...primary.map((muscle) => ({ muscle, role: 'primary' as const })),
    ...secondary.map((muscle) => ({ muscle, role: 'secondary' as const })),
  ]
}

function entry(
  name: string,
  muscleSubgroup: 'Stretch' | 'Mobility Drill' | 'Foam Rolling',
  primary: string[],
  secondary: string[] = [],
  opts: { perSide?: boolean; equipment?: string } = {},
): Omit<Exercise, 'id'> {
  return {
    name,
    muscleGroup: 'Mobility',
    muscleSubgroup,
    equipment: opts.equipment ?? (muscleSubgroup === 'Foam Rolling' ? 'Other' : 'Bodyweight'),
    targetMuscles: targets(primary, secondary),
    ...(opts.perSide ? { perSide: true } : {}),
    createdAt: Date.now(),
  }
}

const side = { perSide: true }

export const MOBILITY_EXERCISES: Omit<Exercise, 'id'>[] = [
  // --- Static stretches ------------------------------------------------------
  entry('Standing Hamstring Stretch', 'Stretch', ['Hamstrings'], ['Gastrocnemius'], side),
  entry('Supine Hamstring Stretch (Strap)', 'Stretch', ['Hamstrings'], ['Gastrocnemius'], { perSide: true, equipment: 'Bands' }),
  entry('Half-Kneeling Hip Flexor Stretch', 'Stretch', ['Hip Flexors'], ['Quadriceps'], side),
  entry('Couch Stretch', 'Stretch', ['Quadriceps', 'Hip Flexors'], [], side),
  entry('Standing Quad Stretch', 'Stretch', ['Quadriceps'], ['Hip Flexors'], side),
  entry('Figure-4 Stretch', 'Stretch', ['Gluteus Maximus', 'Gluteus Medius'], [], side),
  entry('Butterfly Stretch', 'Stretch', ['Adductors'], ['Hip Flexors']),
  entry('Frog Stretch', 'Stretch', ['Adductors'], ['Hip Flexors']),
  entry('Seated Straddle Stretch', 'Stretch', ['Adductors', 'Hamstrings'], ['Erector Spinae']),
  entry('Deep Squat Hold', 'Stretch', ['Adductors', 'Gluteus Maximus'], ['Soleus', 'Erector Spinae']),
  entry('Wall Calf Stretch', 'Stretch', ['Gastrocnemius'], ['Soleus'], side),
  entry('Kneeling Shin Stretch', 'Stretch', ['Tibialis Anterior'], ['Quadriceps']),
  entry('Doorway Pec Stretch', 'Stretch', ['Pec Major (Sternocostal / Mid-Lower Chest)', 'Pec Major (Clavicular / Upper Chest)'], ['Anterior Deltoid']),
  entry('Cross-Body Shoulder Stretch', 'Stretch', ['Posterior Deltoid'], ['Rhomboids'], side),
  entry('Overhead Triceps Stretch', 'Stretch', ['Triceps Brachii (Long Head)'], ['Latissimus Dorsi'], side),
  entry('Bench Lat Stretch', 'Stretch', ['Latissimus Dorsi', 'Teres Major'], ['Triceps Brachii (Long Head)']),
  entry('Sleeper Stretch', 'Stretch', ['Rotator Cuff'], ['Posterior Deltoid'], side),
  entry('Neck Side Stretch', 'Stretch', ['Trapezius (Upper)', 'Neck'], [], side),
  entry('Wrist Flexor Stretch', 'Stretch', ['Forearm Flexors'], [], side),
  entry('Wrist Extensor Stretch', 'Stretch', ['Forearm Extensors'], [], side),
  entry('Supine Spinal Twist', 'Stretch', ['Obliques', 'Erector Spinae'], ['Gluteus Medius'], side),
  entry('Standing Side Bend', 'Stretch', ['Obliques', 'Latissimus Dorsi'], ['Quadratus Lumborum'], side),

  // --- Mobility drills (time a round of reps) --------------------------------
  entry('90/90 Hip Switches', 'Mobility Drill', ['Gluteus Medius', 'Adductors'], ['Hip Flexors']),
  entry("World's Greatest Stretch", 'Mobility Drill', ['Hip Flexors', 'Hamstrings'], ['Obliques', 'Adductors'], side),
  entry('Hip CARs', 'Mobility Drill', ['Hip Flexors', 'Gluteus Medius'], ['Adductors'], side),
  entry('Shoulder CARs', 'Mobility Drill', ['Rotator Cuff', 'Anterior Deltoid', 'Posterior Deltoid'], [], side),
  entry('Thoracic Open Book', 'Mobility Drill', ['Pec Major (Sternocostal / Mid-Lower Chest)', 'Obliques'], ['Rhomboids'], side),
  entry('Quadruped Thoracic Rotation', 'Mobility Drill', ['Rhomboids', 'Trapezius (Mid/Lower)'], ['Obliques'], side),
  entry('Thread the Needle', 'Mobility Drill', ['Rhomboids', 'Posterior Deltoid'], ['Trapezius (Mid/Lower)'], side),
  entry('Wall Slides', 'Mobility Drill', ['Serratus Anterior', 'Trapezius (Mid/Lower)'], ['Rotator Cuff']),
  entry('Band Pass-Throughs', 'Mobility Drill', ['Anterior Deltoid', 'Pec Major (Clavicular / Upper Chest)'], ['Rotator Cuff'], { equipment: 'Bands' }),
  entry('Knee-to-Wall Ankle Rocks', 'Mobility Drill', ['Soleus', 'Gastrocnemius'], [], side),
  entry('Leg Swings (Front-to-Back)', 'Mobility Drill', ['Hamstrings', 'Hip Flexors'], [], side),
  entry('Leg Swings (Side-to-Side)', 'Mobility Drill', ['Adductors', 'Hip Abductors'], [], side),
  entry('Arm Circles', 'Mobility Drill', ['Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid'], ['Rotator Cuff']),
  entry('Inchworm Walkout', 'Mobility Drill', ['Hamstrings'], ['Gastrocnemius', 'Anterior Deltoid']),

  // --- Foam rolling / soft tissue --------------------------------------------
  entry('Foam Roll: Quads', 'Foam Rolling', ['Quadriceps']),
  entry('Foam Roll: Outer Thigh / IT Band', 'Foam Rolling', ['Hip Abductors'], ['Quadriceps'], side),
  entry('Foam Roll: Hamstrings', 'Foam Rolling', ['Hamstrings']),
  entry('Foam Roll: Calves', 'Foam Rolling', ['Gastrocnemius', 'Soleus']),
  entry('Foam Roll: Glutes', 'Foam Rolling', ['Gluteus Maximus', 'Gluteus Medius'], [], side),
  entry('Foam Roll: Adductors', 'Foam Rolling', ['Adductors'], [], side),
  entry('Foam Roll: Upper Back', 'Foam Rolling', ['Rhomboids', 'Trapezius (Mid/Lower)'], ['Erector Spinae']),
  entry('Foam Roll: Lats', 'Foam Rolling', ['Latissimus Dorsi'], ['Teres Major'], side),
  entry('Lacrosse Ball: Pecs', 'Foam Rolling', ['Pec Major (Sternocostal / Mid-Lower Chest)'], ['Anterior Deltoid'], side),
]
