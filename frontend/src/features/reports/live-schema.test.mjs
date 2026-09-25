import assert from 'node:assert/strict'
import test from 'node:test'
import { isNativeEditable, metricGroups, metricValue, reportSections, reportSummary, rows, scalar, setMetric, setRows, setScalar } from './live-schema.ts'

test('the v1 snapshot covers weekly and monthly metrics for all report departments', () => {
  const codes = ['operations', 'marketing', 'research_and_development', 'admin_and_payroll', 'design', 'build_out', 'pr_and_partnerships', 'executive_assistant', 'finance', 'warehouse_and_spend', 'equipment_and_maintenance', 'store_manager']
  for (const code of codes) for (const type of ['weekly', 'monthly']) {
    assert.ok(metricGroups(code, type).length > 0, `${code} ${type}`)
    assert.ok(reportSections(type).some((section) => section.metrics))
  }
})

test('native payload changes preserve other inventory fields and metric history', () => {
  const original = { schema_version: 1, extra: { untouched: true }, metrics: { cost: { cups: { label: 'Cups', target: '100', previous: '90', current: '91' } } } }
  const changed = setScalar(original, 'executive_summary', 'biggest_win', 'Delivered')
  const withRows = setRows(changed, 'workstreams', [{ workstream: 'Training', outcome: 'Done' }])
  const withMetric = setMetric(withRows, 'cost', 'cups', 'current', '99', 'Cups', '100')
  assert.deepEqual(withMetric.extra, { untouched: true })
  assert.equal(scalar(withMetric, 'executive_summary', 'biggest_win'), 'Delivered')
  assert.equal(rows(withMetric, 'workstreams')[0].outcome, 'Done')
  assert.deepEqual(metricValue(withMetric, 'cost', 'cups'), { label: 'Cups', target: '100', previous: '90', current: '99' })
  assert.equal(reportSummary('monthly', withMetric), 'Delivered')
  assert.equal(original.metrics.cost.cups.current, '91')
})

test('v2 and unknown payload versions are never silently overwritten as v1', () => {
  assert.equal(isNativeEditable({ version: 2, entries: {} }), false)
  assert.equal(isNativeEditable({ schema_version: 9 }), false)
  assert.equal(isNativeEditable({ schema_version: 1 }), true)
})
