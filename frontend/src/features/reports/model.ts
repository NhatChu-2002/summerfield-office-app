import { reportSchema, type ReportField } from './schema.ts'

export type ReportRecord = {
  id: string
  department: string
  month: string
  status: 'draft' | 'submitted'
  values: Record<string, string>
  updatedAt: string
}

export function reportId(department: string, month: string): string { return `${department}-${month}` }

export function monthsBack(from: Date, count = 12): string[] {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(from.getFullYear(), from.getMonth() - index, 1)
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  })
}

export function monthLabel(month: string): string {
  const [year, number] = month.split('-').map(Number)
  return new Date(year, number - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function reportProgress(department: string, values: Record<string, string>) {
  const fields = reportSchema(department).flatMap((section) => section.fields)
  const filled = fields.filter((field) => (values[field.key] || '').trim()).length
  const missing = fields.filter((field) => field.required && !(values[field.key] || '').trim())
  return { filled, total: fields.length, missing }
}

export function reportHighlights(reports: ReportRecord[], month: string) {
  return reports.filter((report) => report.month === month && report.status === 'submitted').map((report) => ({
    department: report.department,
    accomplishment: (report.values.accomplish || '').trim(),
    improvement: (report.values.improve || '').trim(),
    ask: (report.values.help || '').trim(),
  }))
}

export function reportExportRows(reports: ReportRecord[], month: string): string[][] {
  const rows = [['Department', 'Month', 'Status', 'Section', 'Question', 'Answer']]
  for (const report of reports.filter((item) => item.month === month)) {
    for (const section of reportSchema(report.department)) {
      for (const field of section.fields) rows.push([report.department, report.month, report.status, section.title, field.label, report.values[field.key] || ''])
    }
  }
  return rows
}

export function reportExportCsv(reports: ReportRecord[], month: string): string {
  return reportExportRows(reports, month).map((row) => row.map((value) => {
    const safe = /^\s*[=+\-@]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
}

export function reportInputType(field: ReportField): 'text' | 'number' {
  return field.kind === 'number' || field.kind === 'money' || field.kind === 'percent' ? 'number' : 'text'
}
