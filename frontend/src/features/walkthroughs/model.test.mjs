import assert from 'node:assert/strict'
import test from 'node:test'
import { canViewWalkthroughs, readVisitMeta, todayInLosAngeles, validVisitDate, withVisitMeta } from './model.ts'

const access = (role, departments = [], stores = []) => ({
  organization: { role, stores }, assignments: departments.map((department_code) => ({ department_code, team_role: 'lead' })),
})

test('navigation follows store or eligible lead access', () => {
  assert.equal(canViewWalkthroughs(access('admin')), true)
  assert.equal(canViewWalkthroughs(access('manager', [], [{ id: 'store-1' }])), true)
  assert.equal(canViewWalkthroughs(access('viewer', ['operations'])), true)
  assert.equal(canViewWalkthroughs(access('viewer', ['store_manager'])), true)
  assert.equal(canViewWalkthroughs(access('viewer', ['marketing'])), false)
})

test('editing visit details preserves scored answers and unknown legacy fields', () => {
  const original = { visit: { meta: { mgrName: 'Old', internalFlag: 'keep', store: 'Historic name' }, 'ops:0': { v: 2, note: 'Good' } }, extra: 1 }
  const meta = { ...readVisitMeta(original), mgrName: 'Alex', queue: '3' }
  const next = withVisitMeta(original, meta, 'Current name', '2026-09-26')
  assert.deepEqual(next.visit['ops:0'], { v: 2, note: 'Good' })
  assert.equal(next.visit.meta.internalFlag, 'keep')
  assert.equal(next.visit.meta.store, 'Historic name')
  assert.equal(next.visit.meta.date, '2026-09-26')
  assert.equal(next.visit.meta.queue, '3')
  assert.equal(original.visit.meta.mgrName, 'Old')
})

test('new and malformed payloads are read without losing a valid date', () => {
  assert.equal(readVisitMeta(null).hasDT, 'no')
  assert.equal(readVisitMeta({ visit: { meta: { hasDT: 'yes', mgrName: 'Bea' } } }).mgrName, 'Bea')
  assert.equal(validVisitDate('2026-09-26'), true)
  assert.equal(validVisitDate('2026-02-30'), false)
  assert.equal(validVisitDate('2026-9-26'), false)
})

test('visit default changes at Los Angeles midnight', () => {
  assert.equal(todayInLosAngeles(new Date('2026-10-01T06:59:00Z')), '2026-09-30')
  assert.equal(todayInLosAngeles(new Date('2026-10-01T07:00:00Z')), '2026-10-01')
})
