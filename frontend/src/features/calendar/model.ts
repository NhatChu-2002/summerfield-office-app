import type { EventInput } from '@fullcalendar/core'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'

export type CalendarDraft = {
  id: string; title: string; department: string; start: string; end: string
  allDay: boolean; time: string; endTime: string; where: string; notes: string; color: string
  repeat: '' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
  interval: number; unit: 'daily' | 'weekly' | 'monthly' | 'yearly'; until: string
  location: string; locationName: string; inviteDepartments: string[]
}

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const nextDate = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)

export function newCalendarDraft(department: string, date = localDate()): CalendarDraft {
  return { id: '', title: '', department, start: date, end: '', allDay: true,
    time: '09:00', endTime: '10:00', where: '', notes: '', color: '', repeat: '', interval: 1, unit: 'weekly', until: '',
    location: '', locationName: '', inviteDepartments: [] }
}

export function validateCalendarDraft(event: CalendarDraft) {
  if (!event.title.trim()) return 'Enter an event title.'
  if (!event.department || !event.start) return 'Choose a calendar and start date.'
  const end = event.end || event.start
  if (end < event.start) return 'The end date cannot be before the start date.'
  if (!event.allDay && (!event.time || !event.endTime || `${end}T${event.endTime}` <= `${event.start}T${event.time}`)) return 'The event must end after it starts.'
  if (event.location === 'custom' && !event.locationName.trim()) return 'Enter a location name.'
  if (event.repeat && event.until && event.until < event.start) return 'The repeat end date cannot be before the first event.'
  if (event.repeat === 'custom' && (!Number.isInteger(event.interval) || event.interval < 1 || event.interval > 99)) return 'Repeat intervals must be between 1 and 99.'
  return ''
}

export function calendarInput(event: CalendarDraft, departments: ReferenceDepartment[]): EventInput {
  const color = event.color || departments.find(item => item.code === event.department)?.color || '#B6CFAE'
  const result: EventInput = {
    id: event.id, title: event.title, allDay: event.allDay, backgroundColor: color,
    borderColor: color === '#FFFFFF' ? '#b7c4bb' : color, textColor: color === '#231F20' ? '#FFFFFF' : '#231F20',
    extendedProps: { department: event.department, where: event.where, notes: event.notes,
      location: event.location, locationName: event.locationName, inviteDepartments: event.inviteDepartments },
  }
  const start = event.allDay ? event.start : `${event.start}T${event.time}`
  const endDate = event.end || event.start
  const end = event.allDay ? nextDate(endDate) : `${endDate}T${event.endTime}`
  if (!event.repeat) return { ...result, start, end }
  const duration = event.allDay
    ? { days: (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000 }
    : { milliseconds: Date.parse(`${end}:00Z`) - Date.parse(`${start}:00Z`) }
  return { ...result, duration, rrule: {
    freq: event.repeat === 'custom' ? event.unit : event.repeat === 'monthly' ? 'monthly' : 'weekly',
    interval: event.repeat === 'custom' ? event.interval : event.repeat === 'biweekly' ? 2 : 1,
    dtstart: event.allDay ? `${event.start}T00:00:00` : start,
    ...(event.until ? { until: `${event.until}T23:59:59` } : {}),
  } }
}
