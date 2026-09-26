import assert from 'node:assert/strict'
import test from 'node:test'
import { historyCursorFilter } from './history-cursor.ts'
import { reportCardKey } from './history-model.ts'

test('history keyset filter advances by timestamp then id without rounding timestamps', () => {
  const timestamp = '2026-09-25T20:06:08.123456+00:00'
  assert.equal(historyCursorFilter({ updated_at: timestamp, id: '22222222-2222-4222-8222-222222222222' }),
    'updated_at.lt."2026-09-25T20:06:08.123456+00:00",and(updated_at.eq."2026-09-25T20:06:08.123456+00:00",id.lt.22222222-2222-4222-8222-222222222222)')
})

test('board keys distinguish organization-scoped and store-scoped cards', () => {
  assert.equal(reportCardKey('marketing', null), 'marketing:')
  assert.equal(reportCardKey('store_manager', 'store-one'), 'store_manager:store-one')
})
