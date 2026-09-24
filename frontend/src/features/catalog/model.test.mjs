import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogCategories, catalogChanges, filterCatalog, orderRequestCsv, safeCatalogUrl } from './model.ts'

const rows = [
  { id: '1', section: 'equipment', code: 'EQ-2', name: 'Tea brewer', category: 'Brewing', brand: 'Leaf', model: 'T2', purpose: 'Tea', specs: '', sku: '', vendor: 'A', pack: '', quantity: '2', price: '200', orderUrl: '', alternateVendor: '' },
  { id: '2', section: 'smallwares', code: '', name: 'Pitcher', category: '', brand: '', model: '', purpose: '', specs: '', sku: 'P-1', vendor: 'B', pack: '', quantity: '1', price: '20', orderUrl: '', alternateVendor: '' },
]

test('catalog filters section, query, and equipment category', () => {
  assert.deepEqual(filterCatalog(rows, 'equipment', 'leaf', 'Brewing').map((row) => row.id), ['1'])
  assert.deepEqual(filterCatalog(rows, 'equipment', '', 'Other'), [])
  assert.deepEqual(filterCatalog(rows, 'smallwares', 'P-1', '').map((row) => row.id), ['2'])
  assert.deepEqual(catalogCategories(rows), ['Brewing'])
})

test('change log records changed editable fields only', () => {
  const changes = catalogChanges(rows[0], { ...rows[0], price: '220', model: 'T3' }, 'Preview', '2026-09-24T00:00:00Z')
  assert.deepEqual(changes.map((change) => change.field), ['model', 'price'])
  assert.equal(changes[1].from, '200')
})

test('order request groups by vendor and neutralizes formulas', () => {
  const csv = orderRequestCsv([{ ...rows[1], name: '=HYPERLINK("bad")' }, rows[0]])
  assert.ok(csv.indexOf('"A"') < csv.indexOf('"B"'))
  assert.match(csv, /"'=HYPERLINK/)
  assert.match(csv, /""bad""/)
})

test('catalog links only allow web URLs', () => {
  assert.equal(safeCatalogUrl('https://vendor.example/item'), 'https://vendor.example/item')
  assert.equal(safeCatalogUrl('javascript:alert(1)'), null)
})
