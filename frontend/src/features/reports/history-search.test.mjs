import assert from 'node:assert/strict'
import test from 'node:test'
import { historySearchFilter, matchingDepartmentCodes } from './history-search.ts'

const departments = [
  { code: 'equipment_and_maintenance', labels: ['I&M', 'Improvement & Maintenance'] },
  { code: 'marketing', labels: ['M&M', 'Marketing & Media'] },
  { code: 'finance', labels: ['Finance'] },
]

test('search matches visible department abbreviations and full names', () => {
  assert.deepEqual(matchingDepartmentCodes('M', departments), ['equipment_and_maintenance', 'marketing'])
  assert.deepEqual(matchingDepartmentCodes('i&m', departments), ['equipment_and_maintenance'])
  assert.deepEqual(matchingDepartmentCodes('maintenance', departments), ['equipment_and_maintenance'])
})

test('history filter searches summaries or matching department codes', () => {
  assert.equal(historySearchFilter('M', matchingDepartmentCodes('M', departments)),
    'summary.ilike."%M%",department_code.in.(equipment_and_maintenance,marketing)')
  assert.equal(historySearchFilter('repair', []), 'summary.ilike."%repair%"')
})

test('wildcards and backslash are literal search characters', () => {
  assert.equal(historySearchFilter('100%_*\\', []), 'summary.ilike."%100\\\\%\\\\_\\\\*\\\\\\\\%"')
})
