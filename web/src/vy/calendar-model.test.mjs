import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarInput, localDate, newCalendarDraft, nextDate, validateCalendarDraft } from './calendar-model.ts'

const departments = [{ code: 'operations', color: '#B6CFAE' }]
const draft = () => ({ ...newCalendarDraft('operations', '2026-09-22'), id: 'test', title: 'Store review' })

test('date-only increment handles leap days and year boundaries', () => {
  assert.equal(nextDate('2024-02-28'), '2024-02-29')
  assert.equal(nextDate('2026-12-31'), '2027-01-01')
  assert.equal(localDate(new Date(2026, 0, 1, 23)), '2026-01-01')
})
test('all-day end is exclusive without losing the last selected day', () => {
  const event = calendarInput({ ...draft(), end: '2026-09-24' }, departments)
  assert.equal(event.start, '2026-09-22')
  assert.equal(event.end, '2026-09-25')
  assert.equal(event.backgroundColor, '#B6CFAE')
})

test('clicked date defaults to a single-day event with an optional end', () => {
  const value = draft()
  assert.equal(value.end, '')
  assert.equal(validateCalendarDraft(value), '')
  assert.equal(calendarInput(value, departments).end, '2026-09-23')
  assert.equal(calendarInput({ ...value, allDay: false }, departments).end, '2026-09-22T10:00')
})

test('location and invited teams stay attached to the preview event', () => {
  const value = { ...draft(), location: 'custom', locationName: 'Training room', inviteDepartments: ['finance', 'hr'] }
  assert.equal(validateCalendarDraft(value), '')
  assert.ok(validateCalendarDraft({ ...value, locationName: ' ' }))
  const event = calendarInput(value, departments)
  assert.equal(event.extendedProps.locationName, 'Training room')
  assert.deepEqual(event.extendedProps.inviteDepartments, ['finance', 'hr'])
})
test('validation rejects blank titles and reversed ranges', () => {
  assert.ok(validateCalendarDraft({ ...draft(), title: ' ' }))
  assert.ok(validateCalendarDraft({ ...draft(), end: '2026-09-21' }))
  assert.ok(validateCalendarDraft({ ...draft(), allDay: false, endTime: '08:00' }))
  assert.equal(validateCalendarDraft({ ...draft(), allDay: false }), '')
})
test('overnight timed events keep a positive wall-clock duration', () => {
  const event = calendarInput({ ...draft(), allDay: false, time: '23:00', end: '2026-09-23', endTime: '01:00', repeat: 'weekly' }, departments)
  assert.deepEqual(event.duration, { milliseconds: 7200000 })
  assert.equal(event.rrule.freq, 'weekly')
})
test('biweekly recurrence preserves inclusive until and all-day duration', () => {
  const event = calendarInput({ ...draft(), repeat: 'biweekly', until: '2026-10-20' }, departments)
  assert.equal(event.rrule.interval, 2)
  assert.equal(event.rrule.until, '2026-10-20T23:59:59')
  assert.deepEqual(event.duration, { days: 1 })
})
test('custom recurrence validates intervals and builds the selected unit', () => {
  assert.ok(validateCalendarDraft({ ...draft(), repeat: 'custom', interval: 0 }))
  assert.ok(validateCalendarDraft({ ...draft(), repeat: 'weekly', until: '2026-08-01' }))
  const event = calendarInput({ ...draft(), repeat: 'custom', unit: 'monthly', interval: 3, color: '#231F20' }, departments)
  assert.equal(event.rrule.freq, 'monthly')
  assert.equal(event.rrule.interval, 3)
  assert.equal(event.textColor, '#FFFFFF')
})
