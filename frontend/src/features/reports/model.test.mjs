import assert from 'node:assert/strict'
import test from 'node:test'
import { monthsBack, reportExportCsv, reportExportRows, reportHighlights, reportProgress } from './model.ts'

test('report months cross the year boundary', () => {
  assert.deepEqual(monthsBack(new Date(2026, 0, 20), 3), ['2026-01', '2025-12', '2025-11'])
})

test('completion counts answer fields and enforces both executive answers', () => {
  const draft = reportProgress('operations', { rev: '0', accomplish: '  ', improve: 'A concrete fix' })
  assert.equal(draft.filled, 2)
  assert.equal(draft.missing.length, 1)
  assert.equal(draft.missing[0].key, 'accomplish')
  assert.equal(reportProgress('operations', { accomplish: 'Finished work', improve: 'A concrete fix' }).missing.length, 0)
})

test('overview uses submitted reports only and export keeps each question attached to its team', () => {
  const records = [
    { department: 'operations', month: '2026-09', status: 'submitted', values: { accomplish: 'Done', improve: 'Fix', help: 'Decision' } },
    { department: 'marketing', month: '2026-09', status: 'draft', values: { accomplish: 'Draft win' } },
  ]
  assert.deepEqual(reportHighlights(records, '2026-09'), [{ department: 'operations', accomplishment: 'Done', improvement: 'Fix', ask: 'Decision' }])
  const rows = reportExportRows(records, '2026-09')
  assert.ok(rows.some((row) => row[0] === 'operations' && row[4] === 'What we accomplished' && row[5] === 'Done'))
  assert.ok(rows.some((row) => row[0] === 'marketing' && row[5] === 'Draft win'))
})

test('CSV quotes answers and neutralizes spreadsheet formulas', () => {
  const csv = reportExportCsv([{ department: 'operations', month: '2026-09', status: 'draft', values: { accomplish: '=HYPERLINK("bad")' } }], '2026-09')
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/)
})
