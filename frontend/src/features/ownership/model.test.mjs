import test from 'node:test'
import assert from 'node:assert/strict'
import { areaScore, decisionAnswer, matchingAreas, parseDecisionLimit, safeSopUrl, suggestedArea } from './model.ts'
import { previewAreas, previewDecisions } from './preview-data.ts'

test('ownership search ranks matching words and respects department filters', () => {
  assert.equal(suggestedArea(previewAreas, 'ice machine broken')?.id, 'sample-repairs')
  assert.ok(areaScore(previewAreas[0], 'ice machine broken') >= 3)
  assert.deepEqual(matchingAreas(previewAreas, '', 'finance').map((area) => area.id), ['sample-invoices'])
  assert.equal(suggestedArea(previewAreas, 'unrelated phrase'), undefined)
})

test('decision limits and routing distinguish in-limit from escalation', () => {
  assert.deepEqual(parseDecisionLimit('$250 to $1,000'), { min: 250, max: 1000 })
  assert.deepEqual(parseDecisionLimit('over $1,000'), { min: 1000, max: Infinity })
  assert.equal(decisionAnswer(previewDecisions, 'repair the blender', '$300')?.over, false)
  assert.equal(decisionAnswer(previewDecisions, 'repair the blender', '$800')?.over, true)
  assert.equal(decisionAnswer(previewDecisions, 'unknown', '') , null)
})

test('SOP links only accept web URLs', () => {
  assert.equal(safeSopUrl('https://example.com/sop'), 'https://example.com/sop')
  assert.equal(safeSopUrl('javascript:alert(1)'), null)
})
