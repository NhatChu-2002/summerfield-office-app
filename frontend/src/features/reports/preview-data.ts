import { reportId, monthsBack, type ReportRecord } from './model'

export function previewReports(): ReportRecord[] {
  const month = monthsBack(new Date(), 2)[1]
  const updatedAt = new Date().toISOString()
  return [
    { id: reportId('operations', month), department: 'operations', month, status: 'submitted', updatedAt,
      values: { accomplish: 'Sample: completed the opening handoff review across stores.', improve: 'Sample: simplify the exception log and confirm an owner for each open issue.', help: 'Sample: confirm who owns the next checklist revision.' } },
    { id: reportId('marketing', month), department: 'marketing', month, status: 'draft', updatedAt,
      values: { accomplish: 'Sample: finished the campaign retrospective.' } },
  ]
}
