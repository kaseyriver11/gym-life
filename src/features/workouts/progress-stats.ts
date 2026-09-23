import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import type { WorkoutSession, WorkoutSet } from '@/types'
import { isDurationBased, isHoldBased } from './muscle-groups'
import { estimatedOneRepMax } from './prs'
import { bodyweightNear } from './strength-score'
import { countSets, isSetLogged } from './use-workout-sessions'

/** Pure stat builders behind the Progress tab. Every one of them counts only
 * really-logged sets (isSetLogged), same as the rest of the app. */

export type ExerciseInfo = { name: string; muscleGroup?: string; equipment?: string }
type Snapshots = { date: string; weightLbs?: number }[]

/** Weeks start Sunday everywhere in the app (matches the Health tab's
 * workouts-per-week ring). */
export function weekStartISO(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(startOfWeek(d, { weekStartsOn: 0 }), 'yyyy-MM-dd')
}

// ---------------------------------------------------------------------------
// Per-exercise history

/** How an exercise's progress is best charted — weight for loaded lifts,
 * reps for plain bodyweight work, time for holds and timed sets. */
export type ExerciseKind = 'weighted' | 'bodyweight' | 'timed' | 'cardio'

export function exerciseKind(info: ExerciseInfo | undefined, loggedSets: WorkoutSet[]): ExerciseKind {
  if (info?.muscleGroup === 'Cardio') return 'cardio'
  if (isHoldBased(info?.muscleGroup)) return 'timed'
  // A plank/dead hang logged in Core etc: time, no reps.
  if (loggedSets.length > 0 && loggedSets.every((s) => (s.durationSeconds ?? 0) > 0 && s.reps === 0)) {
    return 'timed'
  }
  if (info?.equipment === 'Bodyweight' && loggedSets.every((s) => s.weight === 0)) return 'bodyweight'
  return 'weighted'
}

export interface ExerciseSessionPoint {
  date: string
  sets: WorkoutSet[]
  /** Best Epley e1RM of the day (bodyweight folded in for bodyweight lifts). */
  e1rm: number
  topWeight: number
  topWeightReps: number
  volume: number
  bestReps: number
  totalReps: number
  /** Longest single hold/timed set, seconds. */
  bestHold: number
  totalSeconds: number
}

/** One point per session this exercise was really logged in, oldest first. */
export function exerciseHistory(
  sessions: WorkoutSession[],
  exerciseId: string,
  info: ExerciseInfo | undefined,
  snapshots: Snapshots,
): ExerciseSessionPoint[] {
  const isBodyweight = info?.equipment === 'Bodyweight'
  const points: ExerciseSessionPoint[] = []
  for (const session of sessions) {
    const sets = session.entries
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets.filter(isSetLogged))
    if (sets.length === 0) continue
    const bw = isBodyweight ? (bodyweightNear(snapshots, session.date) ?? 0) : 0
    let e1rm = 0
    let topWeight = 0
    let topWeightReps = 0
    let volume = 0
    for (const s of sets) {
      const load = s.weight + bw
      e1rm = Math.max(e1rm, estimatedOneRepMax(load, s.reps))
      volume += load * s.reps
      if (s.weight > topWeight || (s.weight === topWeight && s.reps > topWeightReps)) {
        topWeight = s.weight
        topWeightReps = s.reps
      }
    }
    points.push({
      date: session.date,
      sets,
      e1rm: Math.round(e1rm),
      topWeight,
      topWeightReps,
      volume: Math.round(volume),
      bestReps: Math.max(...sets.map((s) => s.reps)),
      totalReps: sets.reduce((n, s) => n + s.reps, 0),
      bestHold: Math.max(...sets.map((s) => s.durationSeconds ?? 0)),
      totalSeconds: sets.reduce((n, s) => n + (s.durationSeconds ?? 0), 0),
    })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/** Heaviest weight ever lifted for exactly N reps, for each rep count
 * that's actually been logged (1-15) — the classic "rep max" table. */
export function repMaxes(points: ExerciseSessionPoint[]): { reps: number; weight: number; date: string }[] {
  const best = new Map<number, { weight: number; date: string }>()
  for (const p of points) {
    for (const s of p.sets) {
      if (s.reps < 1 || s.reps > 15 || s.weight <= 0) continue
      const cur = best.get(s.reps)
      if (!cur || s.weight > cur.weight) best.set(s.reps, { weight: s.weight, date: p.date })
    }
  }
  return [...best.entries()].map(([reps, v]) => ({ reps, ...v })).sort((a, b) => a.reps - b.reps)
}

/** Exercises with at least one really-logged set, most recently done first. */
export function loggedExercises(
  sessions: WorkoutSession[],
): { exerciseId: string; name: string; lastDate: string; sessionCount: number }[] {
  const byId = new Map<string, { name: string; lastDate: string; dates: Set<string> }>()
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (!entry.sets.some(isSetLogged)) continue
      const cur = byId.get(entry.exerciseId) ?? { name: entry.exerciseName, lastDate: '', dates: new Set() }
      cur.dates.add(session.date)
      if (session.date > cur.lastDate) {
        cur.lastDate = session.date
        cur.name = entry.exerciseName
      }
      byId.set(entry.exerciseId, cur)
    }
  }
  return [...byId.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, name: v.name, lastDate: v.lastDate, sessionCount: v.dates.size }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// Personal records

export interface ExerciseRecord {
  exerciseId: string
  name: string
  muscleGroup?: string
  kind: ExerciseKind
  /** The headline number, formatted by kind (e1RM lbs, reps, or seconds). */
  best: number
  /** The set behind it, e.g. "225 × 5". */
  detail: string
  /** When the current record was set. */
  date: string
  /** How many times the record has been broken — a lift you keep beating. */
  timesImproved: number
}

/** All-time best per strength/timed exercise (cardio has its own records). */
export function personalRecords(
  sessions: WorkoutSession[],
  exercisesById: Map<string, ExerciseInfo>,
  snapshots: Snapshots,
): ExerciseRecord[] {
  const records: ExerciseRecord[] = []
  for (const { exerciseId, name } of loggedExercises(sessions)) {
    const info = exercisesById.get(exerciseId)
    const points = exerciseHistory(sessions, exerciseId, info, snapshots)
    const kind = exerciseKind(info, points.flatMap((p) => p.sets))
    if (kind === 'cardio') continue
    const metric = (p: ExerciseSessionPoint) =>
      kind === 'timed' ? p.bestHold : kind === 'bodyweight' ? p.bestReps : p.e1rm
    let best = 0
    let bestPoint: ExerciseSessionPoint | null = null
    let timesImproved = -1
    for (const p of points) {
      if (metric(p) > best) {
        best = metric(p)
        bestPoint = p
        timesImproved++
      }
    }
    if (!bestPoint || best <= 0) continue
    let detail: string
    if (kind === 'timed') detail = `${formatSeconds(best)} hold`
    else if (kind === 'bodyweight') detail = `${best} reps`
    else {
      const set = bestPoint.sets.reduce((a, s) =>
        estimatedOneRepMax(s.weight, s.reps) > estimatedOneRepMax(a.weight, a.reps) ? s : a,
      )
      detail = `${set.weight} × ${set.reps}`
    }
    records.push({
      exerciseId,
      name: info?.name ?? name,
      muscleGroup: info?.muscleGroup,
      kind,
      best,
      detail,
      date: bestPoint.date,
      timesImproved: Math.max(0, timesImproved),
    })
  }
  return records.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
}

export function formatSeconds(total: number): string {
  const s = Math.round(total)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Consistency

export type ActivityType = 'lift' | 'cardio' | 'mobility'

export function activityTypeFor(muscleGroup?: string): ActivityType {
  if (muscleGroup === 'Cardio') return 'cardio'
  if (isHoldBased(muscleGroup)) return 'mobility'
  return 'lift'
}

/** Which kinds of training happened on each date (really-logged sets only). */
export function activityByDate(
  sessions: WorkoutSession[],
  exercisesById: Map<string, ExerciseInfo>,
): Map<string, Set<ActivityType>> {
  const days = new Map<string, Set<ActivityType>>()
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (!entry.sets.some(isSetLogged)) continue
      const type = activityTypeFor(exercisesById.get(entry.exerciseId)?.muscleGroup)
      const set = days.get(session.date) ?? new Set()
      set.add(type)
      days.set(session.date, set)
    }
  }
  return days
}

/** Consecutive weeks (ending with last week — this week still counts if it
 * already made it) with at least `target` training days. */
export function weekStreak(days: Map<string, Set<ActivityType>>, target: number, today = new Date()): number {
  const perWeek = new Map<string, number>()
  for (const date of days.keys()) {
    const wk = weekStartISO(date)
    perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1)
  }
  const thisWeek = weekStartISO(today)
  let streak = (perWeek.get(thisWeek) ?? 0) >= target ? 1 : 0
  let cursor = addDays(parseISO(thisWeek), -7)
  while ((perWeek.get(format(cursor, 'yyyy-MM-dd')) ?? 0) >= target) {
    streak++
    cursor = addDays(cursor, -7)
  }
  return streak
}

// ---------------------------------------------------------------------------
// Weekly sets per muscle group

/** Broadly-cited productive range of hard sets per muscle per week. */
export const WEEKLY_SET_RANGE = { low: 10, high: 20 } as const

/** Sets per broad muscle group for each of the last `weeks` Sun-Sat weeks
 * (oldest first; the last one is this week, still in progress). Strength
 * work only — cardio and holds aren't "sets" in this sense. An exercise
 * counts toward its own muscleGroup; a left/right pair is one set. */
export function weeklyMuscleSets(
  sessions: WorkoutSession[],
  exercisesById: Map<string, ExerciseInfo>,
  weeks = 4,
  today = new Date(),
): { weekStarts: string[]; groups: { group: string; counts: number[] }[] } {
  const thisWeek = parseISO(weekStartISO(today))
  const weekStarts = Array.from({ length: weeks }, (_, i) =>
    format(addDays(thisWeek, -7 * (weeks - 1 - i)), 'yyyy-MM-dd'),
  )
  const index = new Map(weekStarts.map((w, i) => [w, i]))
  const byGroup = new Map<string, number[]>()
  for (const session of sessions) {
    const i = index.get(weekStartISO(session.date))
    if (i == null) continue
    for (const entry of session.entries) {
      const group = exercisesById.get(entry.exerciseId)?.muscleGroup ?? 'Other'
      if (isDurationBased(group)) continue
      const n = countSets(entry.sets.filter(isSetLogged))
      if (n === 0) continue
      const counts = byGroup.get(group) ?? Array(weeks).fill(0)
      counts[i] += n
      byGroup.set(group, counts)
    }
  }
  const groups = [...byGroup.entries()]
    .map(([group, counts]) => ({ group, counts }))
    .sort((a, b) => b.counts.reduce((x, y) => x + y, 0) - a.counts.reduce((x, y) => x + y, 0))
  return { weekStarts, groups }
}

// ---------------------------------------------------------------------------
// Cardio

export interface CardioSession {
  date: string
  exerciseId: string
  activity: string
  seconds: number
  miles: number
  /** Seconds per mile, when there's a distance. */
  pace?: number
  /** Time-weighted average heart rate across the blocks that have one. */
  avgHeartRate?: number
}

export function cardioSessions(
  sessions: WorkoutSession[],
  exercisesById: Map<string, ExerciseInfo>,
): CardioSession[] {
  const out: CardioSession[] = []
  for (const session of sessions) {
    for (const entry of session.entries) {
      const info = exercisesById.get(entry.exerciseId)
      if (info?.muscleGroup !== 'Cardio') continue
      const sets = entry.sets.filter(isSetLogged)
      const seconds = sets.reduce((n, s) => n + (s.durationSeconds ?? 0), 0)
      const miles = sets.reduce((n, s) => n + (s.distanceMiles ?? 0), 0)
      if (seconds <= 0 && miles <= 0) continue
      const withHr = sets.filter((s) => s.avgHeartRate != null && (s.durationSeconds ?? 0) > 0)
      const hrSeconds = withHr.reduce((n, s) => n + (s.durationSeconds ?? 0), 0)
      out.push({
        date: session.date,
        exerciseId: entry.exerciseId,
        activity: info.name,
        seconds,
        miles,
        pace: miles > 0 && seconds > 0 ? seconds / miles : undefined,
        avgHeartRate:
          hrSeconds > 0
            ? Math.round(withHr.reduce((n, s) => n + s.avgHeartRate! * (s.durationSeconds ?? 0), 0) / hrSeconds)
            : undefined,
      })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** Cardio minutes and miles per Sun-Sat week, oldest first. */
export function cardioWeeks(
  list: CardioSession[],
  weeks = 8,
  today = new Date(),
): { weekStart: string; minutes: number; miles: number }[] {
  const thisWeek = parseISO(weekStartISO(today))
  const rows = Array.from({ length: weeks }, (_, i) => ({
    weekStart: format(addDays(thisWeek, -7 * (weeks - 1 - i)), 'yyyy-MM-dd'),
    minutes: 0,
    miles: 0,
  }))
  for (const c of list) {
    const idx = weeks - 1 - Math.floor(differenceInCalendarDays(thisWeek, parseISO(weekStartISO(c.date))) / 7)
    if (idx < 0 || idx >= weeks) continue
    rows[idx].minutes += c.seconds / 60
    rows[idx].miles += c.miles
  }
  return rows.map((r) => ({ ...r, minutes: Math.round(r.minutes), miles: Math.round(r.miles * 10) / 10 }))
}

export interface CardioRecord {
  label: string
  value: string
  date: string
}

/** Per-activity records: longest distance, longest session, and fastest
 * pace (only over efforts of at least a mile, so a 0.1 mi sprint entry
 * doesn't claim "fastest"). */
export function cardioRecords(list: CardioSession[]): { activity: string; records: CardioRecord[] }[] {
  const byActivity = new Map<string, CardioSession[]>()
  for (const c of list) byActivity.set(c.activity, [...(byActivity.get(c.activity) ?? []), c])
  return [...byActivity.entries()].map(([activity, items]) => {
    const records: CardioRecord[] = []
    const longest = items.reduce((a, b) => (b.miles > a.miles ? b : a))
    if (longest.miles > 0) records.push({ label: 'Farthest', value: `${longest.miles} mi`, date: longest.date })
    const duration = items.reduce((a, b) => (b.seconds > a.seconds ? b : a))
    if (duration.seconds > 0) records.push({ label: 'Longest', value: formatSeconds(duration.seconds), date: duration.date })
    const paced = items.filter((c) => c.pace != null && c.miles >= 1)
    if (paced.length > 0) {
      const fastest = paced.reduce((a, b) => (b.pace! < a.pace! ? b : a))
      records.push({ label: 'Fastest pace', value: `${formatSeconds(fastest.pace!)} /mi`, date: fastest.date })
    }
    return { activity, records }
  })
}
