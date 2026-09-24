import { localDateKey, type TimeCorrection, type TimeEntry } from './model'

function atDaysAgo(days: number, hour: number, minute = 0): Date {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() - days)
  return date
}

export function previewTimeEntries(): TimeEntry[] {
  const ownDay = atDaysAgo(2, 9)
  const teamDay = atDaysAgo(3, 8, 30)
  return [
    { id: 'preview-me', personId: 'preview-me', date: localDateKey(ownDay), inAt: ownDay.toISOString(),
      outAt: atDaysAgo(2, 17).toISOString(), meals: [{ startAt: atDaysAgo(2, 12).toISOString(), endAt: atDaysAgo(2, 12, 30).toISOString() }], rests: [atDaysAgo(2, 10, 45).toISOString()] },
    { id: 'preview-teammate', personId: 'preview-teammate', date: localDateKey(teamDay), inAt: teamDay.toISOString(),
      outAt: atDaysAgo(3, 16, 30).toISOString(), meals: [{ startAt: atDaysAgo(3, 12).toISOString(), endAt: atDaysAgo(3, 12, 30).toISOString() }], rests: [] },
  ]
}

export function previewTimeCorrections(): TimeCorrection[] {
  return [{ id: 'sample-request', personId: 'preview-teammate', date: localDateKey(atDaysAgo(3, 8, 30)),
    desiredIn: '08:15', desiredOut: '16:30', reason: 'Sample correction request for layout preview.',
    requestedAt: new Date().toISOString(), status: 'pending' }]
}
