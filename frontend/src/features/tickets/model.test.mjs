import assert from 'node:assert/strict'
import test from 'node:test'
import { canReviewTicket, canRouteTicket, canSubmitTicket, nextTicketStatuses, statusLabel, ticketServiceMessage, validateTicketDraft } from './model.ts'

const access = (role, teamRole = 'viewer', stores = []) => ({
  organization: { role, stores }, assignments: [{ department_code: 'marketing', team_role: teamRole }],
})
const draft = { storeId: 'store-1', departmentCode: 'marketing', category: 'facility', priority: 'normal', title: '  Broken shelf  ', description: '' }
const departments = ['operations', 'marketing']

test('submission includes department leads without widening store-manager access', () => {
  assert.equal(canSubmitTicket(access('manager', 'viewer', [{ id: 'store-1' }])), true)
  assert.equal(canSubmitTicket(access('manager')), false)
  assert.equal(canSubmitTicket(access('viewer', 'lead')), true)
  assert.equal(canSubmitTicket(access('viewer', 'member')), false)
  assert.equal(canRouteTicket(access('viewer', 'lead')), true)
  assert.equal(canRouteTicket(access('manager', 'viewer', [{ id: 'store-1' }])), false)
})

test('review follows admin or department lead access, not store management', () => {
  assert.equal(canReviewTicket(access('admin'), 'finance'), true)
  assert.equal(canReviewTicket(access('viewer', 'lead'), 'marketing'), true)
  assert.equal(canReviewTicket(access('manager', 'viewer', [{ id: 'store-1' }]), 'marketing'), false)
  assert.equal(canReviewTicket(access('viewer', 'lead'), 'finance'), false)
})

test('new ticket validation mirrors the shared schema limits', () => {
  assert.equal(validateTicketDraft(draft, ['store-1'], departments), null)
  assert.match(validateTicketDraft({ ...draft, storeId: 'other' }, ['store-1'], departments), /store/)
  assert.match(validateTicketDraft({ ...draft, departmentCode: 'hr' }, ['store-1'], departments), /department/)
  assert.match(validateTicketDraft({ ...draft, title: '   ' }, ['store-1'], departments), /title/)
  assert.match(validateTicketDraft({ ...draft, description: 'x'.repeat(4001) }, ['store-1'], departments), /4,000/)
})

test('status choices match the database transition graph', () => {
  assert.deepEqual(nextTicketStatuses('open'), ['acknowledged', 'in_progress'])
  assert.deepEqual(nextTicketStatuses('blocked'), ['in_progress'])
  assert.deepEqual(nextTicketStatuses('closed'), ['open'])
  assert.equal(statusLabel('in_progress'), 'In progress')
})

test('missing ticket migration has a useful message', () => {
  assert.match(ticketServiceMessage(new Error('Could not find the function public.list_tickets in the schema cache')), /setup is not complete/)
  assert.equal(ticketServiceMessage(new Error('Network request failed')), 'Network request failed')
})
