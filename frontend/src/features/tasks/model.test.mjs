import test from 'node:test'
import assert from 'node:assert/strict'
import { addDays, bucketMyTasks, canChangeTaskForRole, delegatedTasks, isOverdue } from './model.ts'

const ME = 'me'
let id = 0
const task = (fields) => ({
  id: `t${++id}`, organization_id: 'org', department_code: 'marketing', title: 'Task', details: '',
  due_date: null, status: 'open', assigned_to: ME, created_by: ME, revision: 1, completed_at: null,
  created_at: '2026-09-01T10:00:00Z', updated_at: '2026-09-01T10:00:00Z', ...fields,
})
const names = (buckets) => buckets.map((bucket) => `${bucket.name}: ${bucket.tasks.map((t) => t.title).join(', ')}`)

test('task status requires write access even for a creator or assignee', () => {
  const assigned = task({ created_by: 'someone', assigned_to: ME })
  const created = task({ created_by: ME, assigned_to: 'someone' })
  assert.equal(canChangeTaskForRole('viewer', assigned, ME), false)
  assert.equal(canChangeTaskForRole('viewer', created, ME), false)
  assert.equal(canChangeTaskForRole(null, assigned, ME), false)
  assert.equal(canChangeTaskForRole('member', assigned, ME), true)
  assert.equal(canChangeTaskForRole('member', created, ME), true)
  assert.equal(canChangeTaskForRole('member', task({ created_by: 'other', assigned_to: 'other' }), ME), false)
  assert.equal(canChangeTaskForRole('lead', task({ created_by: 'other', assigned_to: 'other' }), ME), true)
})

test('addDays crosses month and leap-year boundaries', () => {
  assert.equal(addDays('2026-09-28', 7), '2026-10-05')
  assert.equal(addDays('2028-02-27', 2), '2028-02-29')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})

test('tasks land in overdue, today, this week, later, and done', () => {
  const today = '2026-09-23'
  const buckets = bucketMyTasks([
    task({ title: 'Late', due_date: '2026-09-20' }),
    task({ title: 'Now', due_date: today }),
    task({ title: 'Soon', due_date: '2026-09-30' }),
    task({ title: 'Next month', due_date: '2026-10-01' }),
    task({ title: 'Someday' }),
    task({ title: 'Finished', status: 'done', due_date: '2026-09-01', completed_at: '2026-09-21T09:00:00Z' }),
    task({ title: 'Not mine', due_date: today, assigned_to: 'someone' }),
  ], ME, today)
  assert.deepEqual(names(buckets), [
    'Overdue: Late', 'Today: Now', 'This week: Soon', 'Later: Next month, Someday', 'Done: Finished',
  ])
})

test('a completed task is never overdue, and empty groups are dropped', () => {
  const done = task({ status: 'done', due_date: '2026-01-01', completed_at: '2026-01-02T00:00:00Z' })
  assert.equal(isOverdue(done, '2026-09-23'), false)
  assert.deepEqual(names(bucketMyTasks([done], ME, '2026-09-23')), ['Done: Task'])
  assert.deepEqual(bucketMyTasks([], ME, '2026-09-23'), [])
})

test('done shows the 15 most recently completed', () => {
  const done = Array.from({ length: 20 }, (_, n) => task({
    title: `D${n}`, status: 'done', completed_at: `2026-09-${String(n + 1).padStart(2, '0')}T00:00:00Z`,
  }))
  const [bucket] = bucketMyTasks(done, ME, '2026-09-23')
  assert.equal(bucket.tasks.length, 15)
  assert.equal(bucket.tasks[0].title, 'D19')
})

test('delegated lists open tasks I created for someone else', () => {
  const list = delegatedTasks([
    task({ title: 'Given away', assigned_to: 'teammate' }),
    task({ title: 'Kept', assigned_to: ME }),
    task({ title: 'Unassigned', assigned_to: null }),
    task({ title: 'Given and done', assigned_to: 'teammate', status: 'done', completed_at: '2026-09-02T00:00:00Z' }),
    task({ title: 'From someone else', assigned_to: 'teammate', created_by: 'boss' }),
  ], ME)
  assert.deepEqual(list.map((t) => t.title), ['Given away'])
})
