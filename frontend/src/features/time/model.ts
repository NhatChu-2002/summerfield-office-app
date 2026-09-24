export type PunchAction = 'in' | 'mealStart' | 'mealEnd' | 'rest' | 'out'

export type TimeEntry = {
  id: string
  personId: string
  date: string
  inAt: string
  outAt?: string
  meals: { startAt: string; endAt?: string }[]
  rests: string[]
}

export type TimeCorrection = {
  id: string
  personId: string
  date: string
  desiredIn: string
  desiredOut: string
  reason: string
  requestedAt: string
  status: 'pending' | 'reviewed' | 'declined'
}

export type TimePeriod = { start: string; end: string; label: string }

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function periodsBack(from: Date, count = 6): TimePeriod[] {
  const periods: TimePeriod[] = []
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let index = 0; index < count; index++) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = cursor.getDate() <= 15 ? 1 : 16
    const last = first === 1 ? 15 : new Date(year, month + 1, 0).getDate()
    periods.push({
      start: localDateKey(new Date(year, month, first)),
      end: localDateKey(new Date(year, month, last)),
      label: `${new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} · ${first}–${last}`,
    })
    cursor = new Date(year, month, first - 1)
  }
  return periods
}

export function workedMinutes(entry: TimeEntry, now = new Date().toISOString()): number {
  const start = Date.parse(entry.inAt)
  const end = Date.parse(entry.outAt || now)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  const elapsed = end - start
  const meal = entry.meals.reduce((total, item) => {
    const mealStart = Date.parse(item.startAt)
    const mealEnd = Date.parse(item.endAt || entry.outAt || now)
    if (!Number.isFinite(mealStart) || !Number.isFinite(mealEnd)) return total
    return total + Math.max(0, Math.min(end, mealEnd) - Math.max(start, mealStart))
  }, 0)
  return Math.max(0, Math.floor((elapsed - Math.min(elapsed, meal)) / 60000))
}

export function punchShift(entry: TimeEntry | undefined, action: PunchAction, now: string, personId: string): TimeEntry {
  const date = localDateKey(new Date(now))
  if (action === 'in') {
    if (entry?.inAt) throw new Error('A shift is already recorded for today.')
    return { id: `${personId}-${date}`, personId, date, inAt: now, meals: [], rests: [] }
  }
  if (!entry?.inAt || entry.outAt || entry.date !== date) throw new Error('Clock in before recording this action.')
  const openMeal = entry.meals.findIndex((meal) => !meal.endAt)
  if (action === 'mealStart') {
    if (openMeal !== -1) throw new Error('End the current meal break first.')
    return { ...entry, meals: [...entry.meals, { startAt: now }] }
  }
  if (action === 'mealEnd') {
    if (openMeal === -1) throw new Error('There is no meal break to end.')
    return { ...entry, meals: entry.meals.map((meal, index) => index === openMeal ? { ...meal, endAt: now } : meal) }
  }
  if (openMeal !== -1) throw new Error('End the meal break first.')
  if (action === 'rest') return { ...entry, rests: [...entry.rests, now] }
  return { ...entry, outAt: now }
}
