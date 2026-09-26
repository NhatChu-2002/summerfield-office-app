import assert from 'node:assert/strict'
import test from 'node:test'
import { readInspection, requiredVisitFields } from './form-model.ts'
import { walkthroughProgress } from './section-progress.ts'
import { activeLanes, safetyItems } from './template.ts'

test('progress exposes every section without relying on horizontal scroll', () => {
  const progress = walkthroughProgress(readInspection(null))
  assert.deepEqual(progress.sections.map((section) => section.key), ['details', 'arrival', 'order', 'safety', 'ops', 'kiosk', 'rd', 'eq', 'mkt', 'review'])
  assert.equal(progress.answered, 0)
  assert.equal(progress.total, requiredVisitFields.length + safetyItems.length + activeLanes(false).reduce((sum, lane) => sum + lane.items.length, 0))
  assert.equal(progress.sections.at(-1).complete, false)
})

test('progress tracks required answers and conditional drive-thru', () => {
  const form = readInspection(null)
  for (const { field } of requiredVisitFields) form.meta[field] = 'Answered'
  for (let index = 0; index < safetyItems.length; index += 1) form.safety[`safe:${index}`].value = 'pass'
  for (const lane of activeLanes(false)) lane.items.forEach((_item, index) => { form.scores[`${lane.id}:${index}`].value = 2 })
  const complete = walkthroughProgress(form)
  assert.equal(complete.answered, complete.total)
  assert.equal(complete.sections.at(-1).complete, true)

  form.meta.hasDT = 'yes'
  const withDriveThru = walkthroughProgress(form)
  assert.equal(withDriveThru.sections.at(-2).key, 'dt')
  assert.equal(withDriveThru.total, complete.total + activeLanes(true).at(-1).items.length)
  assert.equal(withDriveThru.sections.at(-1).complete, false)
})
