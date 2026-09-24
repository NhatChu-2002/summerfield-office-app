import test from 'node:test'
import assert from 'node:assert/strict'
import { safeWatchUrl, visibleWatchItems } from './model.ts'

test('watch items filter by department and sort newest first without changing input', () => {
  const items = [
    { id: 'a', department: 'operations', date: '2026-04-01' },
    { id: 'b', department: 'marketing', date: '2026-05-01' },
    { id: 'c', department: 'operations', date: '2026-06-01' },
  ]
  assert.deepEqual(visibleWatchItems(items, 'operations').map((item) => item.id), ['c', 'a'])
  assert.deepEqual(items.map((item) => item.id), ['a', 'b', 'c'])
})

test('external watch links accept web URLs only', () => {
  assert.equal(safeWatchUrl('https://example.com/story'), 'https://example.com/story')
  assert.equal(safeWatchUrl('javascript:alert(1)'), null)
  assert.equal(safeWatchUrl('data:text/html,test'), null)
  assert.equal(safeWatchUrl('/relative'), null)
})
