import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DEPARTMENTS } from '../../../frontend/src/shared/config/departments.ts'
import { previewOnlyDepartments, referenceDepartments } from '../../../frontend/src/shared/config/reference-departments.ts'

const migration = readFileSync(new URL('../migrations/202609220001_hq_mvp.sql', import.meta.url), 'utf8')
const statusMigration = readFileSync(new URL('../migrations/202609250003_require_task_write_access_for_status.sql', import.meta.url), 'utf8')
const projectsMigration = readFileSync(new URL('../migrations/202609260002_hq_projects.sql', import.meta.url), 'utf8')
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

test('task status RPC requires department write access and preserves restricted execution', () => {
  assert.match(statusMigration, /create or replace function public\.set_hq_task_status\(/i)
  assert.match(statusMigration, /if not public\.can_write_hq_department\(v_task\.organization_id, v_task\.department_code\)/i)
  assert.match(statusMigration, /revoke all on function public\.set_hq_task_status\(uuid, uuid, integer, text\) from public, anon;/i)
  assert.match(statusMigration, /grant execute on function public\.set_hq_task_status\(uuid, uuid, integer, text\) to authenticated, service_role;/i)
})

test('HQ project constraint matches supported departments and browser grants stay read-only', () => {
  const check = projectsMigration.match(/check\s*\(department_code\s+in\s*\(([^)]+)\)\)/i)
  assert.ok(check)
  assert.deepEqual([...check[1].matchAll(/'([^']+)'/g)].map(([, code]) => code).sort(), supportedCodes)
  assert.match(projectsMigration, /alter table public\.hq_projects enable row level security;/i)
  assert.match(projectsMigration, /grant select on public\.hq_projects to authenticated;/i)
  assert.doesNotMatch(projectsMigration, /grant (?:all|update|delete|insert) on public\.hq_projects to authenticated;/i)
})

test('HQ project mutations are revision checked and cannot be called anonymously', () => {
  assert.equal((projectsMigration.match(/revision is distinct from p_expected_revision/g) || []).length, 2)
  assert.match(projectsMigration, /department_member\.team_role in \('member', 'lead'\)/i)
  assert.match(projectsMigration, /create function public\.list_hq_project_owners\(/i)
  for (const name of ['create_hq_project', 'update_hq_project', 'set_hq_project_archived']) {
    assert.match(projectsMigration, new RegExp(`revoke all on function public\\.${name}\\(`, 'i'))
    assert.match(projectsMigration, new RegExp(`grant execute on function public\\.${name}\\(`, 'i'))
  }
})
