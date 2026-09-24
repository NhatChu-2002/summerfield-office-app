import assert from 'node:assert/strict'
import test from 'node:test'
import { periodsBack, punchShift, workedMinutes } from './model.ts'

test('half-month periods cross a leap-year boundary', () => {
  const periods = periodsBack(new Date(2024, 2, 3), 3)
  assert.deepEqual(periods.map(({ start, end }) => [start, end]), [
    ['2024-03-01', '2024-03-15'],
    ['2024-02-16', '2024-02-29'],
    ['2024-02-01', '2024-02-15'],
  ])
})

test('punch transitions require a valid shift and meal state', () => {
  const inAt = '2026-09-24T09:00:00-07:00'
  const started = punchShift(undefined, 'in', inAt, 'me')
  const meal = punchShift(started, 'mealStart', '2026-09-24T12:00:00-07:00', 'me')
  assert.throws(() => punchShift(meal, 'out', '2026-09-24T12:05:00-07:00', 'me'), /End the meal/)
  const resumed = punchShift(meal, 'mealEnd', '2026-09-24T12:30:00-07:00', 'me')
  const ended = punchShift(resumed, 'out', '2026-09-24T17:00:00-07:00', 'me')
  assert.equal(workedMinutes(ended), 450)
  assert.throws(() => punchShift(ended, 'in', inAt, 'me'), /already recorded/)
})

test('open meals are excluded from elapsed work without negative minutes', () => {
  const entry = punchShift(undefined, 'in', '2026-09-24T09:00:00Z', 'me')
  const meal = punchShift(entry, 'mealStart', '2026-09-24T12:00:00Z', 'me')
  assert.equal(workedMinutes(meal, '2026-09-24T12:40:00Z'), 180)
})
