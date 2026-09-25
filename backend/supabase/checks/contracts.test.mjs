import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DEPARTMENTS } from '../../../frontend/src/shared/config/departments.ts'
import { previewOnlyDepartments, referenceDepartments } from '../../../frontend/src/shared/config/reference-departments.ts'

const migration = readFileSync(new URL('../migrations/202609220001_hq_mvp.sql', import.meta.url), 'utf8')
const supportedCodes = DEPARTMENTS.map(({ code }) => code).sort()

test('HQ task and update constraints match supported membership departments', () => {
  const checks = [...migration.matchAll(/check\s*\(department_code\s+in\s*\(([^)]+)\)\)/gi)]
  assert.equal(checks.length, 2)
  for (const [, list] of checks) {
    const codes = [...list.matchAll(/'([^']+)'/g)].map(([, code]) => code).sort()
    assert.deepEqual(codes, supportedCodes)
  }
})

test('IT and HR stay in design preview, outside supported access codes', () => {
  const previewCodes = previewOnlyDepartments.map(({ code }) => code).sort()
  assert.deepEqual(previewCodes, ['hr', 'it'])
  assert.deepEqual(referenceDepartments.filter(({ code }) => !supportedCodes.includes(code)).map(({ code }) => code).sort(), previewCodes)
  assert.equal(new Set([...supportedCodes, ...previewCodes]).size, supportedCodes.length + previewCodes.length)
})

test('initial HQ migration declares RLS and narrow browser grants', () => {
  for (const table of ['hq_tasks', 'hq_updates']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security;`, 'i'))
  }
  assert.match(migration, /revoke all on public\.hq_tasks, public\.hq_updates from anon, authenticated;/i)
  assert.match(migration, /grant select, insert on public\.hq_tasks, public\.hq_updates to authenticated;/i)
})
