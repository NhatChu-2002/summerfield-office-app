import { periodFromDates, reportHref, type LiveReportType } from './live-period.ts'
import type { TeamReportSummary } from './api.ts'

export function historyPeriod(report: TeamReportSummary) {
  if (report.report_type !== 'weekly' && report.report_type !== 'monthly') return null
  return periodFromDates(report.report_type as LiveReportType, report.period_start, report.period_end)
}

export function historyHref(report: TeamReportSummary, view: 'all' | 'draft' | 'submitted'): string | null {
  const period = historyPeriod(report)
  if (!period) return null
  const base = reportHref(report.department_code, period, report.store_id || undefined)
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}start=${encodeURIComponent(report.period_start)}&end=${encodeURIComponent(report.period_end)}&from=${view}`
}

export function appendHistory(existing: TeamReportSummary[], incoming: TeamReportSummary[]): TeamReportSummary[] {
  const seen = new Set(existing.map((report) => report.id))
  return [...existing, ...incoming.filter((report) => {
    if (seen.has(report.id)) return false
    seen.add(report.id)
    return true
  })]
}
