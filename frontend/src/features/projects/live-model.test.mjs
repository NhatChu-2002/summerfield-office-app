import test from 'node:test'
import assert from 'node:assert/strict'
import { canArchiveLiveProject, canEditLiveProject, filterLiveProjects, validateProjectDraft } from './live-model.ts'

const project = { department_code: 'marketing', created_by: 'creator', owner_id: 'owner' }
const access = (userId, role, teamRole) => ({
  userId, organization: { role }, assignments: teamRole ? [{ department_code: 'marketing', team_role: teamRole }] : [],
})

test('project controls follow department and creator/owner roles', () => {
  assert.equal(canEditLiveProject(access('owner', 'viewer', 'member'), project), true)
  assert.equal(canEditLiveProject(access('creator', 'viewer', 'member'), project), true)
  assert.equal(canEditLiveProject(access('other', 'viewer', 'member'), project), false)
  assert.equal(canEditLiveProject(access('owner', 'viewer', 'viewer'), project), false)
  assert.equal(canEditLiveProject(access('other', 'viewer', 'lead'), project), true)
  assert.equal(canEditLiveProject(access('other', 'manager', null), project), false)
  assert.equal(canEditLiveProject(access('other', 'admin', null), project), true)
  assert.equal(canArchiveLiveProject(access('owner', 'viewer', 'member'), project), false)
  assert.equal(canArchiveLiveProject(access('other', 'viewer', 'lead'), project), true)
})

test('project draft rejects invalid date order and non-web links', () => {
  const draft = { name: 'Launch', description: '', startDate: null, dueDate: null, asanaUrl: null }
  assert.equal(validateProjectDraft(draft), null)
  assert.match(validateProjectDraft({ ...draft, name: ' ' }), /name/)
  assert.match(validateProjectDraft({ ...draft, startDate: '2026-10-02', dueDate: '2026-10-01' }), /Due date/)
  assert.match(validateProjectDraft({ ...draft, asanaUrl: 'javascript:alert(1)' }), /link/)
})

test('connected project list combines text, team, status, and archive filters', () => {
  const projects = [
    { id: 'a', name: 'Menu launch', description: 'Fall drinks', department_code: 'marketing', status: 'track', archived_at: null },
    { id: 'b', name: 'Store opening', description: 'North site', department_code: 'build_out', status: 'risk', archived_at: null },
    { id: 'c', name: 'Old menu', description: 'Archived', department_code: 'marketing', status: 'done', archived_at: '2026-09-26T00:00:00Z' },
  ]
  assert.deepEqual(filterLiveProjects(projects, { query: 'drinks', departmentCode: 'marketing', status: 'track', archived: false }).map((item) => item.id), ['a'])
  assert.deepEqual(filterLiveProjects(projects, { query: 'menu', departmentCode: '', status: '', archived: true }).map((item) => item.id), ['c'])
  assert.deepEqual(filterLiveProjects(projects, { query: '', departmentCode: 'finance', status: '', archived: false }), [])
  assert.equal(projects.length, 3)
})
