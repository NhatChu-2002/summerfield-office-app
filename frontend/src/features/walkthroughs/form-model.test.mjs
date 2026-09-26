import assert from 'node:assert/strict'
import test from 'node:test'
import { firstMissing, inspectionStats, laneStats, readInspection, scoreKey, withInspection } from './form-model.ts'
import { activeLanes, lanes, safetyItems } from './template.ts'

const fullForm = (driveThru = false) => {
  const form = readInspection(null)
  Object.assign(form.meta, {
    geo: '123 Main', time: '09:00', mgrName: 'Manager', queue: '2', waitOrder: '3',
    waitDrink: '5', crew: 'Alex', channel: 'Drive-thru', orderTime: '09:10',
    readyTime: '09:15', orderTotal: '12', orderItems: 'Tea', hasDT: driveThru ? 'yes' : 'no',
  })
  safetyItems.forEach((_item, index) => { form.safety[`safe:${index}`].value = 'pass' })
  activeLanes(driveThru).forEach((lane) => lane.items.forEach((_item, index) => {
    form.scores[scoreKey(lane.id, index)].value = 2
  }))
  return form
}

test('template keeps legacy lane identity, weight, and item counts', () => {
  assert.deepEqual(lanes.map(({ id, max, items }) => [id, max, items.length]), [
    ['ops', 35, 16], ['kiosk', 8, 5], ['rd', 22, 9], ['eq', 20, 12], ['mkt', 15, 7], ['dt', 15, 9],
  ])
  assert.equal(safetyItems.length, 10)
})

test('N/A removes only its own item from scoring denominator', () => {
  const form = fullForm()
  form.scores['ops:0'].value = 'na'
  form.scores['ops:1'].value = 0
  assert.equal(laneStats(lanes[0], form).points, 35 * 28 / 30)
  assert.equal(inspectionStats(form).score, 98)
  assert.equal(inspectionStats(form).grade, 'A')
})

test('safety failures are a gate but do not change scored points', () => {
  const form = fullForm()
  form.safety['safe:2'].value = 'fail'
  assert.equal(inspectionStats(form).score, 100)
  assert.equal(inspectionStats(form).safetyFails, 1)
  assert.equal(firstMissing(form), null)
})

test('submission checks required fields, safety, and active scored items in order', () => {
  const form = readInspection(null)
  assert.deepEqual(firstMissing(form), { section: 'details', label: 'Address at time of visit' })
  const filled = fullForm(true)
  assert.equal(firstMissing(filled), null)
  filled.scores['dt:0'].value = null
  assert.equal(firstMissing(filled)?.section, 'dt')
  filled.meta.hasDT = 'no'
  assert.equal(firstMissing(filled), null)
})

test('editing legacy inspection retains unknown fields and answer metadata', () => {
  const source = { extra: 1, visit: {
    meta: { store: 'Old name', legacy: true }, 'ops:0': { v: 2, note: 'Original', photoHint: 'keep' },
    findings: [{ text: 'Fix', owner: 'Ops', due: '', legacy: 'keep' }], unknown: { keep: true },
  } }
  const form = readInspection(source)
  form.scores['ops:0'].note = 'Updated'
  form.findings[0].owner = 'Manager'
  const result = withInspection(source, form, 'New name', '2026-09-26')
  assert.equal(result.extra, 1)
  assert.equal(result.visit.unknown.keep, true)
  assert.equal(result.visit.meta.store, 'Old name')
  assert.equal(result.visit['ops:0'].photoHint, 'keep')
  assert.equal(result.visit['ops:0'].note, 'Updated')
  assert.equal(result.visit.findings[0].legacy, 'keep')
  assert.equal(source.visit['ops:0'].note, 'Original')
})
