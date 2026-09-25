import assert from 'node:assert/strict'
import test from 'node:test'
import { legacyReportSections } from './legacy-reader-model.ts'

test('weekly inventory-form payload has familiar sections, labels, and metric group names', () => {
  const sections = legacyReportSections({
    version: 2,
    named: { one: { value: 'Team is on track' }, wsrc: { value: 'on', checked: false }, color: { value: 'GREEN' } },
    entries: {
      s2: [{ promise: 'Launch campaign', status: 'DONE', why: 'Live', newdate: '' }, {}],
      ew: [{ saw: 'Demand rising', hits: 'Sales', doing: 'Reordering' }],
    },
    metricGroups: [{ index: '0', rows: [{ metric: 'Email signups', last: '40', now: '54', target: '50', mwhy: 'New offer' }] }],
  }, 'weekly', 'marketing')

  assert.deepEqual(sections.map((section) => section.title), ['Headline', "Last week's promises", 'Your numbers', 'Early warnings', 'Workload'])
  assert.deepEqual(sections[0].blocks[0].fields, [{ label: 'In one sentence', value: 'Team is on track' }, { label: 'Health', value: 'GREEN' }])
  assert.equal(sections[1].blocks.length, 1)
  assert.deepEqual(sections[1].blocks[0].fields.map((field) => field.label), ['Promise', 'Status', 'Evidence or reason'])
  assert.match(sections[2].blocks[0].label, /Email signups/)
  assert.deepEqual(sections[2].blocks[0].fields.map((field) => field.label), ['Last week', 'This week', 'Target', 'Why / action'])
  assert.equal(sections[2].blocks[0].fields.find((field) => field.label === 'This week').value, '54')
  assert.equal(sections[4].blocks[0].fields[0].value, 'No')
})

test('monthly inventory-form payload includes all answered sections and preserves unknown fields', () => {
  const sections = legacyReportSections({
    version: 2,
    named: { mwin: { value: 'On-time launch' }, mkept: { value: '3' }, mdiff: { value: 'Ask earlier' }, extra_note: { value: 'Keep this' } },
    entries: { mw: [{ ws: 'Launch', share: 'About half', wsout: 'Completed' }], mrisk: [{ risk: 'Supplier', closes: 'Backup quote' }], other: [{ custom_value: 'Retained' }] },
    metricGroups: [{ index: '0', rows: [{ metric: 'Sales', now: '1200' }] }],
  }, 'monthly', 'marketing')

  assert.deepEqual(sections.map((section) => section.title), [
    'Executive summary', 'Promise-kept rate', 'Workstreams', 'The numbers', "What I'd do differently",
    'Risks and what closes each', 'Other saved fields', 'Additional rows · Other',
  ])
  assert.equal(sections[2].blocks[0].fields[0].label, 'Workstream')
  assert.equal(sections[3].blocks[0].fields.find((field) => field.label === 'This month').value, '1200')
  assert.deepEqual(sections.at(-2).blocks[0].fields, [{ label: 'Extra Note', value: 'Keep this' }])
  assert.deepEqual(sections.at(-1).blocks[0].fields, [{ label: 'Custom Value', value: 'Retained' }])
})

test('malformed or blank optional groups do not show raw objects or empty sections', () => {
  assert.deepEqual(legacyReportSections({ version: 2, named: { one: { value: '' } }, entries: { s2: [null, {}] }, metricGroups: [{ index: 'bad', rows: [{ metric: {} }] }] }, 'weekly', 'marketing'), [])
})
