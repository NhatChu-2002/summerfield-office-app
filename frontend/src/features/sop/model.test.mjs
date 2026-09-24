import test from 'node:test'
import assert from 'node:assert/strict'
import { blankSop, safeSopUrl, sopChecks, sopText } from './model.ts'

test('a blank SOP starts with three steps and remains incomplete', () => {
  const draft = blankSop('operations')
  assert.equal(draft.steps.length, 3)
  assert.equal(sopChecks(draft).find((check) => check.key === 'steps').ok, false)
})

test('SOP number must match its department and steps need owners', () => {
  const draft = blankSop('operations')
  draft.sopNumber = 'SOP-MM-001'
  assert.equal(sopChecks(draft).find((check) => check.key === 'sopNumber').ok, false)
  draft.sopNumber = 'SOP-OPS-001'
  draft.steps = draft.steps.map((step, index) => ({ ...step, text: `Step ${index + 1}`, owner: 'Shift lead' }))
  assert.equal(sopChecks(draft).find((check) => check.key === 'sopNumber').ok, true)
  assert.equal(sopChecks(draft).find((check) => check.key === 'steps').ok, true)
})

test('placeholder text blocks completeness and text export preserves sections', () => {
  const draft = blankSop('operations')
  draft.purpose = 'TBD'
  draft.steps[0].text = 'Open the station'
  assert.equal(sopChecks(draft).find((check) => check.key === 'placeholders').ok, false)
  assert.match(sopText(draft), /4. Procedure\n1. Open the station/)
})

test('impossible calendar dates do not count as effective dates', () => {
  const draft = blankSop('operations')
  draft.effectiveDate = '2026-02-30'
  assert.equal(sopChecks(draft).find((check) => check.key === 'effectiveDate').ok, false)
})

test('complete manual draft satisfies the house checklist', () => {
  const draft = blankSop('operations')
  Object.assign(draft, {
    title: 'Opening procedure', sopNumber: 'SOP-OPS-001', owner: 'Shift lead', appliesTo: 'Opening team',
    effectiveDate: '2026-09-24', reviewDate: '2027-09-24', purpose: 'Consistent opening',
    scope: 'Before store opening', escalation: 'Contact operations manager', related: ['None'],
  })
  draft.roles = [{ role: 'Shift lead', owns: 'Verify opening' }]
  draft.steps = draft.steps.map((step, index) => ({ ...step, text: `Action ${index + 1}`, owner: 'Shift lead' }))
  draft.approvals = [{ role: 'Operations manager', name: '', date: '' }]
  assert.equal(sopChecks(draft).every((check) => check.ok), true)
  draft.history[0].change = 'TBD'
  assert.equal(sopChecks(draft).find((check) => check.key === 'placeholders').ok, false)
})

test('filed URL accepts web links only', () => {
  assert.equal(safeSopUrl('javascript:alert(1)'), '')
  assert.equal(safeSopUrl('https://drive.google.com/file'), 'https://drive.google.com/file')
})
