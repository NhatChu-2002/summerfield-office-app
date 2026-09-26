import assert from 'node:assert/strict'
import test from 'node:test'
import { historySearchFilter, isMissingDateSearch, matchingDepartmentCodes, matchingStoreIds } from './history-search.ts'

const departments = [
  { code: 'equipment_and_maintenance', labels: ['I&M'] },
  { code: 'marketing', labels: ['M&M'] },
  { code: 'finance', labels: ['Finance'] },
  { code: 'store_manager', labels: ['Stores'] },
]

test('search matches displayed report names, not hidden department codes', () => {
  assert.deepEqual(matchingDepartmentCodes('M', departments), ['equipment_and_maintenance', 'marketing'])
  assert.deepEqual(matchingDepartmentCodes('i&m', departments), ['equipment_and_maintenance'])
  assert.deepEqual(matchingDepartmentCodes('maintenance', departments), [])
  assert.deepEqual(matchingDepartmentCodes('Store', departments), ['store_manager'])
})

test('store search matches the displayed store name', () => {
  const stores = [{ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', name: 'Store One' }]
  assert.deepEqual(matchingStoreIds('one', stores), [stores[0].id])
  assert.deepEqual(matchingStoreIds('M', stores), [])
})

test('history filter searches summary, visible dates, and matching names', () => {
  assert.equal(historySearchFilter('M', matchingDepartmentCodes('M', departments), []),
    'summary.ilike."%M%",team_report_search_dates.ilike."%M%",department_code.in.(equipment_and_maintenance,marketing)')
  assert.equal(historySearchFilter('Sep 2026', [], []),
    'summary.ilike."%Sep 2026%",team_report_search_dates.ilike."%Sep 2026%"')
  assert.equal(historySearchFilter('One', [], ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1']),
    'summary.ilike."%One%",team_report_search_dates.ilike."%One%",store_id.in.(bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1)')
})

test('wildcards and backslash are literal search characters', () => {
  assert.equal(historySearchFilter('100%_*\\', [], []),
    'summary.ilike."%100\\\\%\\\\_\\\\*\\\\\\\\%",team_report_search_dates.ilike."%100\\\\%\\\\_\\\\*\\\\\\\\%"')
})

test('missing date-search migration falls back without hiding name and summary matches', () => {
  assert.equal(isMissingDateSearch({ code: '42703', message: 'column team_reports.team_report_search_dates does not exist' }), true)
  assert.equal(isMissingDateSearch({ code: '42703', message: 'column team_reports.other_column does not exist' }), false)
  assert.equal(historySearchFilter('M', ['equipment_and_maintenance'], [], false),
    'summary.ilike."%M%",department_code.in.(equipment_and_maintenance)')
})
