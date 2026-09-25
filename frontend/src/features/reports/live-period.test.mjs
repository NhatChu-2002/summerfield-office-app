import assert from 'node:assert/strict'
import test from 'node:test'
import { currentPeriod, periodFromDates, periodFromToken, recentPeriods, reportHref, reportsHref } from './live-period.ts'

test('weekly reports use Sunday through Saturday in Los Angeles', () => {
  const period = currentPeriod('weekly', new Date('2026-09-27T06:30:00Z'))
  assert.deepEqual([period.start, period.end], ['2026-09-20', '2026-09-26'])
  assert.equal(periodFromToken('weekly', '2026-09-21'), null)
  assert.equal(periodFromToken('weekly', '2026-02-29'), null)
  assert.deepEqual(recentPeriods('weekly', new Date('2026-01-04T20:00:00Z'), 2).map((item) => item.start), ['2026-01-04', '2025-12-28'])
})

test('monthly reports use exact calendar bounds, including leap years', () => {
  assert.deepEqual([periodFromToken('monthly', '2024-02').start, periodFromToken('monthly', '2024-02').end], ['2024-02-01', '2024-02-29'])
  assert.equal(periodFromToken('monthly', '2026-13'), null)
  assert.deepEqual(recentPeriods('monthly', new Date('2026-01-20T20:00:00Z'), 2).map((item) => item.start), ['2026-01-01', '2025-12-01'])
})

test('report links preserve type, period, and store scope', () => {
  const period = periodFromToken('weekly', '2026-09-20')
  assert.equal(reportsHref(period), '#/reports/weekly/2026-09-20')
  assert.equal(reportHref('store_manager', period, 'store-id'), '#/report/store_manager/weekly/2026-09-20?store=store-id')
})

test('stored historical periods may differ from current default week boundaries', () => {
  assert.deepEqual([periodFromDates('weekly', '2026-09-21', '2026-09-27').start, periodFromDates('weekly', '2026-09-21', '2026-09-27').end], ['2026-09-21', '2026-09-27'])
  assert.equal(periodFromDates('weekly', '2026-09-31', '2026-10-06'), null)
  assert.equal(periodFromDates('monthly', '2026-09-30', '2026-09-01'), null)
})
