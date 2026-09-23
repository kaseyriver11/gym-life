import type { WorkoutTemplate } from '@/types'
import { MOBILITY_EXERCISES } from './mobility'
import { slugify } from './seed'
import { YOGA_EXERCISES } from './yoga'

/**
 * Built-in mobility/stretching routines. Each is an ordinary saved-workout
 * shape (so starting one uses the same path as any saved workout, and the
 * Log tab's sequence player can auto-run it), referencing catalog exercises
 * by their deterministic slug id. `seconds` is per hold — per side for
 * one-sided (perSide) moves, which expand into left/right pairs on start.
 */
interface RoutineStep {
  name: string
  seconds: number
  /** Rounds of the hold (default 1). */
  rounds?: number
}

interface RoutineDef {
  key: string
  name: string
  blurb: string
  steps: RoutineStep[]
}

/** Transition time between holds when a routine is played back. */
const TRANSITION_SECONDS = 10

const ROUTINES: RoutineDef[] = [
  {
    key: 'post-run',
    name: 'Post-Run Reset',
    blurb: 'Calves, quads, hamstrings and hips after a run or ride.',
    steps: [
      { name: 'Wall Calf Stretch', seconds: 45 },
      { name: 'Standing Quad Stretch', seconds: 45 },
      { name: 'Standing Hamstring Stretch', seconds: 45 },
      { name: 'Half-Kneeling Hip Flexor Stretch', seconds: 45 },
      { name: 'Figure-4 Stretch', seconds: 45 },
      { name: 'Foam Roll: Calves', seconds: 60 },
      { name: 'Foam Roll: Quads', seconds: 60 },
    ],
  },
  {
    key: 'desk-hips',
    name: 'Desk Hips Unlock',
    blurb: 'Hip flexors, glutes and adductors — for long days sitting.',
    steps: [
      { name: '90/90 Hip Switches', seconds: 60 },
      { name: 'Couch Stretch', seconds: 60 },
      { name: 'Pigeon Pose', seconds: 60 },
      { name: 'Butterfly Stretch', seconds: 60 },
      { name: 'Frog Stretch', seconds: 60 },
      { name: "World's Greatest Stretch", seconds: 30 },
      { name: 'Deep Squat Hold', seconds: 60 },
    ],
  },
  {
    key: 'full-body-10',
    name: 'Full-Body 10',
    blurb: 'A quick head-to-toe pass. Good any day.',
    steps: [
      { name: 'Cat-Cow', seconds: 45 },
      { name: 'Downward Dog', seconds: 45 },
      { name: "World's Greatest Stretch", seconds: 30 },
      { name: 'Thread the Needle', seconds: 30 },
      { name: 'Standing Hamstring Stretch', seconds: 30 },
      { name: 'Doorway Pec Stretch', seconds: 45 },
      { name: 'Supine Spinal Twist', seconds: 30 },
      { name: "Child's Pose", seconds: 60 },
    ],
  },
  {
    key: 'warmup-lower',
    name: 'Warm-Up: Lower Body',
    blurb: 'Before squats, deadlifts or a run — moving, not long holds.',
    steps: [
      { name: 'Leg Swings (Front-to-Back)', seconds: 30 },
      { name: 'Leg Swings (Side-to-Side)', seconds: 30 },
      { name: 'Hip CARs', seconds: 30 },
      { name: 'Knee-to-Wall Ankle Rocks', seconds: 30 },
      { name: 'Inchworm Walkout', seconds: 45 },
      { name: 'Deep Squat Hold', seconds: 45 },
    ],
  },
  {
    key: 'warmup-upper',
    name: 'Warm-Up: Upper Body',
    blurb: 'Before pressing or pulling — shoulders and upper back.',
    steps: [
      { name: 'Arm Circles', seconds: 30 },
      { name: 'Band Pass-Throughs', seconds: 45 },
      { name: 'Wall Slides', seconds: 45 },
      { name: 'Shoulder CARs', seconds: 30 },
      { name: 'Thoracic Open Book', seconds: 30 },
    ],
  },
  {
    key: 'shoulders',
    name: 'Shoulders & Upper Back',
    blurb: 'Lats, pecs, rotator cuff and neck — after heavy upper days.',
    steps: [
      { name: 'Foam Roll: Upper Back', seconds: 60 },
      { name: 'Foam Roll: Lats', seconds: 45 },
      { name: 'Bench Lat Stretch', seconds: 45 },
      { name: 'Doorway Pec Stretch', seconds: 45 },
      { name: 'Sleeper Stretch', seconds: 45 },
      { name: 'Cross-Body Shoulder Stretch', seconds: 45 },
      { name: 'Neck Side Stretch', seconds: 30 },
    ],
  },
  {
    key: 'wind-down',
    name: 'Evening Wind-Down',
    blurb: 'Slow, easy holds to finish the day.',
    steps: [
      { name: "Child's Pose", seconds: 60 },
      { name: 'Cat-Cow', seconds: 45 },
      { name: 'Supine Spinal Twist', seconds: 45 },
      { name: 'Supine Hamstring Stretch (Strap)', seconds: 45 },
      { name: 'Figure-4 Stretch', seconds: 45 },
      { name: 'Corpse Pose (Savasana)', seconds: 120 },
    ],
  },
]

const byName = new Map([...MOBILITY_EXERCISES, ...YOGA_EXERCISES].map((e) => [e.name, e]))

export interface BuiltInRoutine {
  key: string
  blurb: string
  /** Approximate total time, both sides and transitions included. */
  minutes: number
  template: WorkoutTemplate
}

export const BUILT_IN_ROUTINES: BuiltInRoutine[] = ROUTINES.map((r) => {
  let seconds = 0
  const entries = r.steps.map((step) => {
    const ex = byName.get(step.name)
    if (!ex) throw new Error(`Routine "${r.name}" references unknown exercise "${step.name}"`)
    const rounds = step.rounds ?? 1
    seconds += (step.seconds + TRANSITION_SECONDS) * rounds * (ex.perSide ? 2 : 1)
    return {
      exerciseId: slugify(step.name),
      exerciseName: step.name,
      plannedSets: Array.from({ length: rounds }, () => ({
        reps: 0,
        weight: 0,
        durationSeconds: step.seconds,
        restAfterSeconds: TRANSITION_SECONDS,
      })),
    }
  })
  return {
    key: r.key,
    blurb: r.blurb,
    minutes: Math.round(seconds / 60),
    template: { id: `builtin-${r.key}`, name: r.name, entries, createdAt: 0, updatedAt: 0 },
  }
})
