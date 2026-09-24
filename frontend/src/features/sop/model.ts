export type SopType = 'Procedure' | 'Store training' | 'Checklist' | 'Policy'
export type SopStatus = 'draft' | 'ready' | 'filed'
export type SopRole = { role: string; owns: string }
export type SopStep = { text: string; owner: string; timing: string; evidence: string }
export type SopApproval = { role: string; name: string; date: string }
export type SopHistory = { version: string; date: string; change: string; by: string }
export type SopDraft = {
  id: string
  status: SopStatus
  type: SopType
  department: string
  title: string
  sopNumber: string
  version: string
  owner: string
  appliesTo: string
  effectiveDate: string
  reviewDate: string
  purpose: string
  scope: string
  roles: SopRole[]
  steps: SopStep[]
  escalation: string
  related: string[]
  approvals: SopApproval[]
  history: SopHistory[]
  referenceText: string
  filedUrl: string
  updatedAt: string
}

export const sopTypes: SopType[] = ['Procedure', 'Store training', 'Checklist', 'Policy']
export const sopCodes: Record<string, string> = {
  company: 'GEN', research_and_development: 'RD', marketing: 'MM', build_out: 'BO', operations: 'OPS',
  finance: 'FIN', warehouse_and_spend: 'WH', equipment_and_maintenance: 'IM', it: 'IT', hr: 'HR',
}

export function blankSop(department = '', referenceText = '', type: SopType = 'Procedure'): SopDraft {
  return {
    id: crypto.randomUUID(), status: 'draft', type, department, title: '', sopNumber: '', version: '1.0',
    owner: '', appliesTo: '', effectiveDate: '', reviewDate: '', purpose: '', scope: '',
    roles: [{ role: '', owns: '' }], steps: Array.from({ length: 3 }, () => ({ text: '', owner: '', timing: '', evidence: '' })),
    escalation: '', related: [''], approvals: [{ role: '', name: '', date: '' }],
    history: [{ version: '1.0', date: new Date().toISOString().slice(0, 10), change: 'Created in SOP Studio', by: '' }],
    referenceText, filedUrl: '', updatedAt: new Date().toISOString(),
  }
}

const placeholder = /(_{3,}|\[[^\]]*\]|\bTBD\b|\bTBA\b|\bXX+\b|MM\/DD\/YYYY)/i
const has = (value: string) => !!value.trim() && !placeholder.test(value)
const isDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function sopChecks(sop: SopDraft): { key: string; label: string; ok: boolean }[] {
  const code = sopCodes[sop.department]
  const number = code ? new RegExp(`^SOP-${code}-\\d{3}$`).test(sop.sopNumber) : false
  const filledSteps = sop.steps.filter((step) => has(step.text))
  const values = [
    sop.title, sop.sopNumber, sop.version, sop.owner, sop.appliesTo, sop.purpose, sop.scope,
    sop.escalation, ...sop.roles.flatMap((role) => [role.role, role.owns]),
    ...sop.steps.flatMap((step) => [step.text, step.owner, step.timing, step.evidence]),
    ...sop.related, ...sop.approvals.flatMap((approval) => [approval.role, approval.name]),
    ...sop.history.flatMap((row) => [row.version, row.change, row.by]),
  ]
  return [
    { key: 'title', label: 'Title', ok: has(sop.title) },
    { key: 'department', label: 'Department chosen', ok: !!code },
    { key: 'sopNumber', label: `SOP number like SOP-${code || 'DEPT'}-001`, ok: number },
    { key: 'version', label: 'Version', ok: has(sop.version) },
    { key: 'owner', label: 'Owner role', ok: has(sop.owner) },
    { key: 'appliesTo', label: 'Who it applies to', ok: has(sop.appliesTo) },
    { key: 'effectiveDate', label: 'Effective date', ok: isDate(sop.effectiveDate) },
    { key: 'reviewDate', label: 'Review date', ok: isDate(sop.reviewDate) },
    { key: 'purpose', label: 'Purpose', ok: has(sop.purpose) },
    { key: 'scope', label: 'Scope and triggers', ok: has(sop.scope) },
    { key: 'roles', label: 'A role with its responsibility', ok: sop.roles.some((role) => has(role.role) && has(role.owns)) },
    { key: 'steps', label: 'At least three steps, each with an owner', ok: filledSteps.length >= 3 && filledSteps.every((step) => has(step.owner)) },
    { key: 'escalation', label: 'Escalation', ok: has(sop.escalation) },
    { key: 'related', label: 'Related documents, or None', ok: sop.related.some(has) },
    { key: 'approvals', label: 'Approver role', ok: sop.approvals.some((approval) => has(approval.role)) },
    { key: 'history', label: 'Version history', ok: sop.history.some((row) => has(row.version) && isDate(row.date)) },
    { key: 'placeholders', label: 'No placeholder text left', ok: !values.some((value) => placeholder.test(value)) },
  ]
}

export function safeSopUrl(value: string): string {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}

export function sopText(sop: SopDraft): string {
  return [
    sop.title || 'Untitled SOP', `${sop.sopNumber || 'Unnumbered'} · v${sop.version} · ${sop.type}`,
    `Owner: ${sop.owner}`, `Applies to: ${sop.appliesTo}`, `Effective: ${sop.effectiveDate}`, `Review: ${sop.reviewDate}`,
    '', '1. Purpose', sop.purpose, '', '2. Scope and triggers', sop.scope, '', '3. Roles and responsibilities',
    ...sop.roles.filter((row) => row.role).map((row) => `- ${row.role}: ${row.owns}`),
    '', '4. Procedure', ...sop.steps.filter((row) => row.text).map((row, index) => `${index + 1}. ${row.text} (Owner: ${row.owner}${row.timing ? `; Timing: ${row.timing}` : ''}${row.evidence ? `; Evidence: ${row.evidence}` : ''})`),
    '', '5. Escalation', sop.escalation, '', '6. Related documents', ...sop.related.filter(Boolean).map((row) => `- ${row}`),
    '', '7. Approval', ...sop.approvals.filter((row) => row.role).map((row) => `- ${row.role}${row.name ? `: ${row.name}` : ''}${row.date ? ` (${row.date})` : ''}`),
    '', '8. Version history', ...sop.history.filter((row) => row.version).map((row) => `- v${row.version} · ${row.date} · ${row.change}${row.by ? ` · ${row.by}` : ''}`),
  ].join('\n')
}
