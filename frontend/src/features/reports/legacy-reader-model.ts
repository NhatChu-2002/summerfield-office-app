import { metricGroups, type Payload } from './live-schema.ts'
import type { LiveReportType } from './live-period.ts'

export type ReadField = { label: string; value: string }
export type ReadBlock = { label: string; fields: ReadField[] }
export type ReadSection = { title: string; blocks: ReadBlock[] }

type Definition = { title: string; source: 'named' | 'entries' | 'metrics'; key?: string; fields?: Record<string, string> }

const weekly: Definition[] = [
  { title: 'Headline', source: 'named', fields: { one: 'In one sentence', color: 'Health' } },
  { title: "Last week's promises", source: 'entries', key: 's2', fields: { promise: 'Promise', pillar: 'Pillar', status: 'Status', why: 'Evidence or reason', newdate: 'New date' } },
  { title: 'Unplanned work', source: 'entries', key: 's3', fields: { item: 'What you did', iwhy: 'Why it mattered' } },
  { title: 'Your numbers', source: 'metrics' },
  { title: 'Early warnings', source: 'entries', key: 'ew', fields: { saw: 'What you noticed', hits: 'Number affected', when: 'How soon', doing: 'Action underway' } },
  { title: 'Blocked', source: 'entries', key: 's5', fields: { what: 'What is stuck', since: 'Blocked since', bywhen: 'Need it by', cost: 'Cost of waiting', need: 'What you need', from: 'From whom' } },
  { title: 'No blockers', source: 'named', fields: { noBlock: 'Nothing is stuck this week' } },
  { title: 'Decisions needed', source: 'entries', key: 's6', fields: { dec: 'Decision', a: 'Option A', b: 'Option B', rec: 'Recommendation', by: 'Needed by', ifw: 'If we wait' } },
  { title: 'Workload', source: 'named', fields: { whrs: 'Hours worked', wcarry: 'Items carried over', wload: 'Capacity', wdrop: 'What to drop first', wmood: 'Team mood', wrisk: 'Retention risk', wgriev: 'Open staff issues', cap: 'Team notes', wsrc: 'Numbers confirmed from source systems' } },
  { title: "Next week's promises", source: 'entries', key: 's8', fields: { np: 'Promise', pillar: 'Pillar', due: 'Due', done: 'Done means' } },
]

const monthly: Definition[] = [
  { title: 'Executive summary', source: 'named', fields: { mwin: 'Biggest win', mrisk1: 'Biggest risk', mfind: 'Key finding', color: 'Overall health', mhwhy: 'Reason and next step' } },
  { title: 'Promise-kept rate', source: 'named', fields: { mkept: 'Promises kept', mmade: 'Promises made', mlast: 'Last month %' } },
  { title: 'Workstreams', source: 'entries', key: 'mw', fields: { ws: 'Workstream', share: 'Share of month', wswho: 'Who worked on it', wsout: 'Outcome', wsstate: 'Current state' } },
  { title: 'By pillar', source: 'entries', key: 'mp', fields: { pillar: 'Pillar', verdict: 'Verdict', obj: 'Objective', landed: 'What landed', mstart: 'Start of month', mend: 'End of month', mtarget: 'Target', carry: 'Carry forward' } },
  { title: 'The numbers', source: 'metrics' },
  { title: 'What repeated', source: 'entries', key: 'mr', fields: { rep: 'Repeated issue', repwhy: 'Why it remained' } },
  { title: 'What we stopped', source: 'entries', key: 'ms', fields: { stop: 'Stopped or paused', stopwhy: 'Why', stopwho: 'Approved by', stopfreed: 'Capacity freed' } },
  { title: "What I'd do differently", source: 'named', fields: { mdiff: 'Reflection' } },
  { title: 'Next month objectives', source: 'entries', key: 'mo', fields: { obj: 'Objective', pillar: 'Pillar', meas: 'How to measure it' } },
  { title: 'Risks and what closes each', source: 'entries', key: 'mrisk', fields: { risk: 'Risk', sized: 'Sized impact', closes: 'What closes it', exposed: 'Who is exposed' } },
]

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function label(key: string): string { return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }

function display(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function fieldsFromRow(value: unknown, labels: Record<string, string>): ReadField[] {
  const saved = record(value)
  const keys = [...Object.keys(labels).filter((key) => key in saved), ...Object.keys(saved).filter((key) => !(key in labels))]
  return keys.map((key) => ({ label: labels[key] || label(key), value: display(saved[key]) })).filter((field) => field.value)
}

function rowBlocks(rows: unknown, labels: Record<string, string>): ReadBlock[] {
  if (!Array.isArray(rows)) return []
  return rows.map((row, index) => ({ label: `Item ${index + 1}`, fields: fieldsFromRow(row, labels) })).filter((block) => block.fields.length)
}

export function legacyReportSections(payload: Payload, type: LiveReportType, departmentCode: string): ReadSection[] {
  const named = record(payload.named)
  const entries = record(payload.entries)
  const definitions = type === 'weekly' ? weekly : monthly
  const usedNamed = new Set<string>()
  const usedEntries = new Set<string>()
  const catalog = metricGroups(departmentCode, type)
  const sections: ReadSection[] = []

  for (const definition of definitions) {
    let blocks: ReadBlock[] = []
    if (definition.source === 'named') {
      const fields = Object.entries(definition.fields || {}).flatMap(([key, fieldLabel]) => {
        usedNamed.add(key)
        const saved = record(named[key])
        const value = typeof saved.checked === 'boolean' ? display(saved.checked) : display(saved.value)
        return value ? [{ label: fieldLabel, value }] : []
      })
      if (fields.length) blocks = [{ label: '', fields }]
    } else if (definition.source === 'entries') {
      usedEntries.add(definition.key || '')
      blocks = rowBlocks(entries[definition.key || ''], definition.fields || {})
    } else {
      const groups = Array.isArray(payload.metricGroups) ? payload.metricGroups : []
      blocks = groups.flatMap((group, index) => {
        const saved = record(group)
        const catalogIndex = Number(saved.index)
        const groupTitle = Number.isInteger(catalogIndex) && catalogIndex >= 0 ? catalog[catalogIndex]?.title : undefined
        return rowBlocks(saved.rows, { metric: 'Metric', last: type === 'weekly' ? 'Last week' : 'Last month', now: type === 'weekly' ? 'This week' : 'This month', target: 'Target', mwhy: 'Why / action' })
          .map((block) => ({ label: `${groupTitle || `Group ${index + 1}`} · ${block.fields.find((field) => field.label === 'Metric')?.value || block.label}`, fields: block.fields.filter((field) => field.label !== 'Metric') }))
      })
      blocks.push(...rowBlocks(payload.looseMetrics, { metric: 'Metric', last: 'Last', now: 'This period', target: 'Target', mwhy: 'Why / action' })
        .map((block) => ({ label: block.fields.find((field) => field.label === 'Metric')?.value || block.label, fields: block.fields.filter((field) => field.label !== 'Metric') })))
    }
    if (blocks.length) sections.push({ title: definition.title, blocks })
  }

  const otherNamed = Object.entries(named).filter(([key]) => !usedNamed.has(key)).flatMap(([key, saved]) => {
    const field = record(saved)
    const value = typeof field.checked === 'boolean' ? display(field.checked) : display(field.value)
    return value ? [{ label: label(key), value }] : []
  })
  if (otherNamed.length) sections.push({ title: 'Other saved fields', blocks: [{ label: '', fields: otherNamed }] })
  for (const [key, rows] of Object.entries(entries)) {
    if (usedEntries.has(key)) continue
    const blocks = rowBlocks(rows, {})
    if (blocks.length) sections.push({ title: `Additional rows · ${label(key)}`, blocks })
  }
  return sections
}
