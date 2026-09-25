import metricSnapshot from './metrics-v1.json' with { type: 'json' }
import type { LiveReportType } from './live-period'

export type Field = { key: string; label: string; kind?: 'notes' | 'select' | 'checkbox'; options?: string[] }
export type Section = { key: string; title: string; guidance: string; fields?: Field[]; repeatable?: boolean; metrics?: boolean }
export type MetricGroup = { key: string; title: string; metrics: { key: string; label: string; target: string }[] }
export type Payload = Record<string, unknown>

const health: Field = { key: 'health', label: 'Health', kind: 'select', options: ['GREEN', 'YELLOW', 'RED'] }
const weekly: Section[] = [
  { key: 'headline', title: 'Headline', guidance: 'One sentence a leader can understand without opening the report.', fields: [{ key: 'text', label: 'In one sentence', kind: 'notes' }, health] },
  { key: 'last_week_promises', title: "Last week's promises", guidance: 'Keep the original wording and record what happened.', repeatable: true, fields: [{ key: 'promise', label: 'Promise' }, { key: 'status', label: 'Status', kind: 'select', options: ['DONE', 'ON TRACK', 'AT RISK', 'MISSED', 'BLOCKED', 'DROPPED'] }, { key: 'result', label: 'Result / evidence', kind: 'notes' }] },
  { key: 'unplanned_work', title: 'Unplanned work', guidance: 'Meaningful work completed outside the plan.', repeatable: true, fields: [{ key: 'item', label: 'Work completed' }, { key: 'impact', label: 'Impact', kind: 'notes' }] },
  { key: 'metrics', title: 'Your numbers', guidance: 'Enter source-system results and explain material movement.', metrics: true },
  { key: 'early_warnings', title: 'Early warnings', guidance: 'What may become a problem?', repeatable: true, fields: [{ key: 'warning', label: 'Warning' }, { key: 'evidence', label: 'What you saw' }, { key: 'response', label: 'Action underway', kind: 'notes' }] },
  { key: 'blockers', title: 'Blocked', guidance: 'Name an owner, exact ask, and needed date.', repeatable: true, fields: [{ key: 'blocker', label: 'Blocker' }, { key: 'owner', label: 'Owner' }, { key: 'ask', label: 'Exact ask', kind: 'notes' }, { key: 'needed_by', label: 'Needed by' }] },
  { key: 'decisions', title: 'Decisions needed', guidance: 'Bring a recommendation.', repeatable: true, fields: [{ key: 'decision', label: 'Decision' }, { key: 'recommendation', label: 'Recommendation', kind: 'notes' }, { key: 'needed_by', label: 'Needed by' }] },
  { key: 'workload', title: 'Workload', guidance: 'Report capacity before work slips.', fields: [{ key: 'hours', label: 'Hours worked' }, { key: 'carryover', label: 'Items carried over' }, { key: 'capacity', label: 'Capacity' }, { key: 'drop_first', label: 'What would you drop first?' }, { key: 'mood', label: 'Team mood' }, { key: 'retention_risk', label: 'Retention risk' }, { key: 'people_issues', label: 'Open people issues' }, { key: 'team_notes', label: 'Team notes', kind: 'notes' }, { key: 'source_confirmed', label: 'Numbers came directly from source systems', kind: 'checkbox' }] },
  { key: 'next_week_promises', title: "Next week's promises", guidance: 'Make measurable commitments and define done.', repeatable: true, fields: [{ key: 'promise', label: 'Promise' }, { key: 'done_means', label: 'Done means' }, { key: 'owner', label: 'Owner' }, { key: 'due_date', label: 'Due' }] },
]

const monthly: Section[] = [
  { key: 'executive_summary', title: 'Executive summary', guidance: 'Size the biggest win and risk, then make one honest health call.', fields: [{ key: 'biggest_win', label: 'Biggest win', kind: 'notes' }, { key: 'key_finding', label: 'Key finding', kind: 'notes' }, { key: 'biggest_risk', label: 'Biggest risk', kind: 'notes' }, health, { key: 'health_reason', label: 'What would firm the rating?' }] },
  { key: 'promise_kept_rate', title: 'Promise-kept rate', guidance: 'Were weekly commitments reliable?', fields: [{ key: 'kept', label: 'Promises kept' }, { key: 'made', label: 'Promises made' }, { key: 'last_month_percent', label: 'Last month %' }] },
  { key: 'workstreams', title: 'What the month was spent on', guidance: 'Main workstreams and outcomes.', repeatable: true, fields: [{ key: 'workstream', label: 'Workstream' }, { key: 'share', label: 'Share of month' }, { key: 'outcome', label: 'Outcome', kind: 'notes' }] },
  { key: 'pillars', title: 'By pillar', guidance: 'Connect work to company pillars.', repeatable: true, fields: [{ key: 'pillar', label: 'Pillar' }, { key: 'work', label: 'Work' }, { key: 'result', label: 'Result', kind: 'notes' }] },
  { key: 'metrics', title: 'The numbers', guidance: 'Use PENDING when a source has not provided a figure.', metrics: true },
  { key: 'repeated_issues', title: 'What repeated', guidance: 'Name recurring blockers.', repeatable: true, fields: [{ key: 'issue', label: 'Issue' }, { key: 'weeks_seen', label: 'Weeks seen' }, { key: 'owner', label: 'Owner' }, { key: 'next_action', label: 'Next action', kind: 'notes' }] },
  { key: 'stopped_work', title: 'What we stopped', guidance: 'Work deliberately stopped to free capacity.', repeatable: true, fields: [{ key: 'item', label: 'Stopped' }, { key: 'reason', label: 'Why' }, { key: 'capacity_released', label: 'Capacity released' }] },
  { key: 'retrospective', title: "What I'd do differently", guidance: 'Keep this useful and direct.', fields: [{ key: 'text', label: 'Retrospective', kind: 'notes' }] },
  { key: 'next_month_objectives', title: 'Next month objectives', guidance: 'Weekly promises should support these objectives.', repeatable: true, fields: [{ key: 'objective', label: 'Objective' }, { key: 'measure', label: 'Done means' }, { key: 'owner', label: 'Owner' }] },
  { key: 'risks', title: 'Risks and what closes each', guidance: 'Name the exact input that resolves each risk.', repeatable: true, fields: [{ key: 'risk', label: 'Risk' }, { key: 'sized_impact', label: 'Impact' }, { key: 'closes_it', label: 'What closes it', kind: 'notes' }, { key: 'exposed', label: 'Who is exposed' }] },
]

export function reportSections(type: LiveReportType): Section[] { return type === 'weekly' ? weekly : monthly }

export function metricGroups(code: string, type: LiveReportType): MetricGroup[] {
  const catalog = metricSnapshot as Record<string, Record<LiveReportType, MetricGroup[]>>
  return catalog[code]?.[type] || []
}

function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
export function scalar(payload: Payload, section: string, key: string): string | boolean {
  const value = object(payload[section])[key]
  return typeof value === 'string' || typeof value === 'boolean' ? value : ''
}
export function rows(payload: Payload, section: string): Record<string, string>[] {
  return Array.isArray(payload[section]) ? (payload[section] as unknown[]).filter((row) => row && typeof row === 'object' && !Array.isArray(row)).map((row) => row as Record<string, string>) : []
}
export function setScalar(payload: Payload, section: string, key: string, value: string | boolean): Payload {
  return { ...payload, schema_version: 1, [section]: { ...object(payload[section]), [key]: value } }
}
export function setRows(payload: Payload, section: string, value: Record<string, string>[]): Payload {
  return { ...payload, schema_version: 1, [section]: value }
}
export function metricValue(payload: Payload, group: string, metric: string): Record<string, unknown> {
  return object(object(object(payload.metrics)[group])[metric])
}
export function setMetric(payload: Payload, group: string, metric: string, field: string, value: string, label: string, target: string): Payload {
  const metrics = object(payload.metrics)
  const groupValues = object(metrics[group])
  return { ...payload, schema_version: 1, metrics: { ...metrics, [group]: { ...groupValues, [metric]: { label, target, ...object(groupValues[metric]), [field]: value } } } }
}
export function reportSummary(type: LiveReportType, payload: Payload): string {
  const value = scalar(payload, type === 'weekly' ? 'headline' : 'executive_summary', type === 'weekly' ? 'text' : 'biggest_win')
  return typeof value === 'string' ? value.trim().slice(0, 500) : ''
}
export function isNativeEditable(payload: Payload): boolean { return payload.version === undefined && (payload.schema_version === undefined || payload.schema_version === 1) }
