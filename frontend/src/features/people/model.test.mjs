import test from 'node:test'
import assert from 'node:assert/strict'
import { findPreviewPeople, sortPreviewPeople, togglePreviewDepartment } from './model.ts'

const people = [
  { id: '2', name: 'Sam', email: 'sam@example.test', role: 'viewer', departments: [] },
  { id: '1', name: 'Alex', email: 'alex@example.test', role: 'admin', departments: ['operations'] },
]

test('preview roster sorts by role without changing the source list', () => {
  assert.deepEqual(sortPreviewPeople(people).map((person) => person.id), ['1', '2'])
  assert.equal(people[0].id, '2')
})

test('preview roster search matches name or email', () => {
  assert.deepEqual(findPreviewPeople(people, 'ALEX').map((person) => person.id), ['1'])
  assert.deepEqual(findPreviewPeople(people, 'example.test').map((person) => person.id), ['1', '2'])
})

test('department toggles add and remove without mutating source', () => {
  const added = togglePreviewDepartment(people[0], 'hr')
  assert.deepEqual(added.departments, ['hr'])
  assert.deepEqual(togglePreviewDepartment(added, 'hr').departments, [])
  assert.deepEqual(people[0].departments, [])
})
