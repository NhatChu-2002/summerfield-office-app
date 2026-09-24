import test from 'node:test'
import assert from 'node:assert/strict'
import { filterProjects, projectProgress, projectSummary, projectTaskGroups, safeProjectUrl } from './model.ts'

const projects = [
  { id: 'a', name: 'Store opening', notes: 'La Habra', department: 'build_out', status: 'risk', manager: 'sam', members: ['vy'] },
  { id: 'b', name: 'Menu refresh', notes: 'Seasonal drinks', department: 'marketing', status: 'track', manager: 'avery', members: [] },
]
const tasks = [
  { id: 'one', projectId: 'a', due: '2026-09-23', status: 'open', assignee: 'vy', kind: 'task', priority: 'urgent' },
  { id: 'two', projectId: 'a', due: '2026-09-20', status: 'done', assignee: 'sam', kind: 'task', priority: 'normal' },
  { id: 'three', projectId: '', due: '', status: 'open', assignee: '', kind: 'ticket', priority: 'normal' },
]

test('project filtering combines search, department, status, and membership', () => {
  assert.deepEqual(filterProjects(projects, { query: 'habra', department: 'build_out', status: 'risk', mineId: 'vy' }).map((item) => item.id), ['a'])
  assert.deepEqual(filterProjects(projects, { query: 'menu', department: '', status: '', mineId: 'vy' }), [])
  assert.equal(projects.length, 2)
})

test('progress and summary ignore completed tasks when counting overdue', () => {
  assert.deepEqual(projectProgress('a', tasks, '2026-09-24'), { total: 2, done: 1, overdue: 1, percent: 50 })
  assert.deepEqual(projectSummary(projects, tasks, 'vy', '2026-09-24'), { running: 2, overdue: 1, tickets: 1, mine: 1 })
  assert.deepEqual(projectTaskGroups(tasks.filter((task) => task.projectId === 'a')).map((group) => group.id), ['urgent', 'done'])
})

test('project links reject non-web protocols', () => {
  assert.equal(safeProjectUrl('https://app.asana.com/0/123'), 'https://app.asana.com/0/123')
  assert.equal(safeProjectUrl('javascript:alert(1)'), null)
  assert.equal(safeProjectUrl('/relative'), null)
})
