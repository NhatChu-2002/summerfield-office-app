import test from 'node:test'
import assert from 'node:assert/strict'
import { equipmentCsv, equipmentValue, filterLocations, locationEquipment, locationStatus, safeFolderUrl } from './model.ts'

const locations = [
  { id: 'b', name: 'Westside', code: 'W2', address: 'Second Street', city: 'Los Angeles', notes: '' },
  { id: 'a', name: 'La Habra', code: 'LH', address: 'Main Street', city: 'La Habra', notes: 'Lease review' },
]

test('location search covers address and notes and sorts without mutating input', () => {
  assert.deepEqual(filterLocations(locations, 'lease').map((item) => item.id), ['a'])
  assert.deepEqual(filterLocations(locations, '').map((item) => item.id), ['a', 'b'])
  assert.equal(locations[0].id, 'b')
})

test('equipment stays with its location and value includes quantity', () => {
  const rows = [{ id: '1', locationId: 'a', code: 'B', cost: 200, quantity: 2 }, { id: '2', locationId: 'b', code: 'A', cost: 10, quantity: 1 }, { id: '3', locationId: 'a', code: 'A', cost: 50, quantity: 3 }]
  const related = locationEquipment(rows, 'a')
  assert.deepEqual(related.map((item) => item.id), ['3', '1'])
  assert.equal(equipmentValue(related), 550)
})

test('folder links only allow web URLs', () => {
  assert.equal(safeFolderUrl('https://drive.google.com/folder'), 'https://drive.google.com/folder')
  assert.equal(safeFolderUrl('javascript:alert(1)'), null)
  assert.equal(safeFolderUrl('/relative'), null)
  assert.equal(locationStatus('build'), 'In build-out')
})

test('equipment CSV escapes quotes and spreadsheet formulas', () => {
  const csv = equipmentCsv([{ code: '=SUM(1)', name: 'Tea "brewer"', brand: '', model: '', quantity: 1, tag: '', serial: '', installed: '', condition: 'good', warrantyEnd: '', cost: 10 }])
  assert.match(csv, /"'=SUM\(1\)"/)
  assert.match(csv, /"Tea ""brewer"""/)
})
