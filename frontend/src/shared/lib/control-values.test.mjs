import test from 'node:test'
import assert from 'node:assert/strict'
import { formatClockTime, formatIsoDate, parseClockTime, parseIsoDate } from './control-values.ts'

test('calendar dates stay local and reject impossible dates', () => {
  assert.equal(formatIsoDate(parseIsoDate('2024-02-29')), '2024-02-29')
  assert.equal(formatIsoDate(parseIsoDate('0099-01-01')), '0099-01-01')
  assert.equal(parseIsoDate('2026-02-29'), undefined)
  assert.equal(parseIsoDate('2026-13-01'), undefined)
})

test('time picker keeps exact minutes and midnight/noon values', () => {
  assert.deepEqual(parseClockTime('00:07'), { hour: 12, minute: 7, period: 'AM' })
  assert.deepEqual(parseClockTime('12:00'), { hour: 12, minute: 0, period: 'PM' })
  assert.deepEqual(parseClockTime('23:59'), { hour: 11, minute: 59, period: 'PM' })
  assert.equal(formatClockTime(12, 7, 'AM'), '00:07')
  assert.equal(formatClockTime(12, 0, 'PM'), '12:00')
  assert.equal(formatClockTime(11, 59, 'PM'), '23:59')
  assert.equal(parseClockTime('24:00'), null)
})
