import assert from 'node:assert/strict'
import test from 'node:test'
import { readInspection } from './form-model.ts'
import { inspectionReport } from './report.ts'

test('manager copy excludes internal discussion and team notes', () => {
  const form = readInspection(null)
  Object.assign(form.meta, { inspectors: 'Internal auditor', q1: 'Confidential reply', team_ops: 'HQ follow-up' })
  const manager = inspectionReport('Store One', '2026-09-26', form, 'manager').map((line) => line.text).join('\n')
  const internal = inspectionReport('Store One', '2026-09-26', form, 'internal').map((line) => line.text).join('\n')
  for (const secret of ['Internal auditor', 'Confidential reply', 'HQ follow-up']) {
    assert.equal(manager.includes(secret), false)
    assert.equal(internal.includes(secret), true)
  }
})

test('report includes safety failures, exceptions, and findings', () => {
  const form = readInspection(null)
  form.safety['safe:0'] = { value: 'fail', note: 'No soap' }
  form.scores['ops:0'] = { value: 0, note: 'No greeting' }
  form.findings = [{ text: 'Restock soap', owner: 'Manager', due: '2026-09-27' }]
  const text = inspectionReport('Store One', '2026-09-26', form, 'manager').map((line) => line.text).join('\n')
  assert.match(text, /Food safety: 1 of 10 answered; 1 failed/)
  assert.match(text, /No soap/)
  assert.match(text, /No greeting/)
  assert.match(text, /Restock soap/)
})
