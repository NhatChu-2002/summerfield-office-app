import assert from 'node:assert/strict'
import test from 'node:test'
import { reportCapabilities } from './access.ts'

const departments = [
  { code: 'marketing' },
  { code: 'store_manager' },
]
const access = (organizationRole, departmentRole, stores = []) => ({
  userId: 'me', displayName: 'Test', email: 'test@example.test',
  organization: { organization_id: 'org', organization_name: 'Test', organization_slug: 'test', role: organizationRole, stores: stores.map((id) => ({ id })) },
  organizations: [],
  assignments: departmentRole ? [{ department_code: 'marketing', team_role: departmentRole }, { department_code: 'store_manager', team_role: departmentRole }] : [],
  departments,
})

test('organization report capabilities distinguish admin, lead, member and viewer', () => {
  assert.deepEqual(reportCapabilities(access('admin', null), 'marketing', null), { read: true, edit: true, submit: true, reopen: true })
  assert.deepEqual(reportCapabilities(access('viewer', 'lead'), 'marketing', null), { read: true, edit: true, submit: true, reopen: false })
  assert.deepEqual(reportCapabilities(access('viewer', 'member'), 'marketing', null), { read: true, edit: true, submit: false, reopen: false })
  assert.deepEqual(reportCapabilities(access('viewer', 'viewer'), 'marketing', null), { read: true, edit: false, submit: false, reopen: false })
  assert.deepEqual(reportCapabilities(access('manager', null), 'marketing', null), { read: false, edit: false, submit: false, reopen: false })
})

test('store report submission needs both department lead and store manager access', () => {
  assert.equal(reportCapabilities(access('viewer', 'lead', ['store-1']), 'store_manager', 'store-1').submit, false)
  assert.equal(reportCapabilities(access('manager', 'lead', ['store-1']), 'store_manager', 'store-1').submit, true)
  assert.equal(reportCapabilities(access('manager', 'member', ['store-1']), 'store_manager', 'store-1').submit, false)
  assert.deepEqual(reportCapabilities(access('manager', 'lead', ['store-1']), 'store_manager', 'store-2'), { read: false, edit: false, submit: false, reopen: false })
  assert.equal(reportCapabilities(access('admin', null, ['store-1']), 'store_manager', 'store-1').reopen, true)
})

test('unsupported departments and wrong scopes are unavailable', () => {
  const lead = access('viewer', 'lead', ['store-1'])
  for (const [code, store] of [['it', null], ['hr', null], ['marketing', 'store-1'], ['store_manager', null]]) {
    assert.deepEqual(reportCapabilities(lead, code, store), { read: false, edit: false, submit: false, reopen: false })
  }
})
