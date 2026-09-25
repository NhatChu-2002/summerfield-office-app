import assert from 'node:assert/strict'
import test from 'node:test'
import { appendHistory, historyHref, historyPeriod } from './history-model.ts'

const report = (id, overrides = {}) => ({
  id, department_code: 'marketing', report_type: 'weekly', period_start: '2026-09-21', period_end: '2026-09-27',
  store_id: null, status: 'draft', summary: 'Weekly handoff', updated_at: '2026-09-28T12:00:00Z', submitted_at: null, ...overrides,
})

test('history opens the exact saved period, including older Monday-start weeks', () => {
  assert.equal(historyPeriod(report('one')).label, 'Sep 21 - Sep 27, 2026')
  assert.equal(historyHref(report('one'), 'draft'), '#/report/marketing/weekly/2026-09-21?start=2026-09-21&end=2026-09-27&from=draft')
  assert.equal(historyHref(report('two', { report_type: 'monthly', period_start: '2026-08-02', period_end: '2026-08-30', store_id: 'store-1' }), 'submitted'), '#/report/marketing/monthly/2026-08?store=store-1&start=2026-08-02&end=2026-08-30&from=submitted')
})

test('history pagination retains separate periods and deduplicates moved rows', () => {
  const first = [report('july', { period_start: '2026-07-01' }), report('august', { period_start: '2026-08-01' })]
  const next = [report('august', { period_start: '2026-08-01' }), report('september')]
  assert.deepEqual(appendHistory(first, next).map((item) => item.id), ['july', 'august', 'september'])
  assert.equal(historyPeriod(report('bad', { report_type: 'vendor_pricing' })), null)
})
