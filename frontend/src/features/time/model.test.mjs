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
  const at = (hour, minute = 0) => new Date(2026, 8, 24, hour, minute).toISOString()
  const inAt = at(9)
  const started = punchShift(undefined, 'in', inAt, 'me')
  const meal = punchShift(started, 'mealStart', at(12), 'me')
  assert.throws(() => punchShift(meal, 'out', at(12, 5), 'me'), /End the meal/)
  const resumed = punchShift(meal, 'mealEnd', at(12, 30), 'me')
  const ended = punchShift(resumed, 'out', at(17), 'me')
  assert.equal(workedMinutes(ended), 450)
  assert.throws(() => punchShift(ended, 'in', inAt, 'me'), /already recorded/)
})

test('open meals are excluded from elapsed work without negative minutes', () => {
  const at = (hour, minute = 0) => new Date(2026, 8, 24, hour, minute).toISOString()
  const entry = punchShift(undefined, 'in', at(9), 'me')
  const meal = punchShift(entry, 'mealStart', at(12), 'me')
  assert.equal(workedMinutes(meal, at(12, 40)), 180)
})
