import { Download, FileText } from 'lucide-react'
import { departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { monthLabel, monthsBack, reportExportCsv, reportHighlights, reportProgress, type ReportRecord } from '../model'
import './reports.css'

function exportPreview(reports: ReportRecord[], month: string) {
  const csv = reportExportCsv(reports, month)
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `Summerfield-report-preview-${month}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ReportsPage({ departments, reports, preview, selectedMonth }: {
  departments: ReferenceDepartment[]
  reports: ReportRecord[]
  preview: boolean
  selectedMonth?: string
}) {
  const months = monthsBack(new Date(), 12)
  const month = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[1] || months[0]
  const selected = reports.filter((report) => report.month === month)
  const submitted = selected.filter((report) => report.status === 'submitted').length
  const highlights = reportHighlights(reports, month)
  const byCode = (code: string) => departments.find((item) => item.code === code)

  return <>
    <header className="vy-hero vy-reports-hero"><div><h1>Monthly reports</h1><p>One report per team, with the same questions each month.</p></div><div className="vy-hero-actions">
      <SelectField ariaLabel="Report month" value={month} onChange={(value) => { window.location.hash = `#/reports/${value}` }} options={months.map((item) => ({ value: item, label: monthLabel(item) }))} size="compact" />
      <button type="button" className="vy-button" disabled={!preview || !selected.length} title={!preview ? 'Shared reports are not connected' : !selected.length ? 'No preview reports for this month' : undefined} onClick={() => exportPreview(selected, month)}><Download size={15} /> Export preview CSV</button>
    </div></header>
    <p className="vy-report-status">{preview ? 'Sample reports and edits stay in this Design preview until you reload.' : 'Shared monthly reports are not connected yet. No company report data is shown here.'}</p>
    <div className="vy-report-totals" aria-label="Report status"><div><strong>{preview ? submitted : '—'}</strong><span>Submitted</span></div><div><strong>{preview ? selected.length - submitted : '—'}</strong><span>Drafts</span></div><div><strong>{preview ? Math.max(0, departments.length - selected.length) : '—'}</strong><span>Not started</span></div></div>
    {preview && highlights.length > 0 && <section className="vy-report-overview" aria-labelledby="vy-report-overview-title"><h2 id="vy-report-overview-title">The month at a glance</h2><div>{highlights.map((item) => {
      const team = byCode(item.department)
      return team ? <article key={item.department} className="vy-report-overview-item" style={departmentStyle(team.color)}><h3>{team.name}</h3><p>{item.accomplishment}</p>{item.improvement && <p><b>Needs attention:</b> {item.improvement}</p>}{item.ask && <p><b>Decision needed:</b> {item.ask}</p>}</article> : null
    })}</div></section>}
    <section className="vy-report-library" aria-labelledby="vy-report-library-title"><h2 id="vy-report-library-title">Each team's report</h2><div className="vy-report-grid">{departments.map((department) => {
      const report = selected.find((item) => item.department === department.code)
      const progress = reportProgress(department.code, report?.values || {})
      return <article key={department.code} className="vy-report-card" style={departmentStyle(department.color)}>
        <div className="vy-report-card-top"><FileText size={17} aria-hidden="true" /><span>{!preview ? 'Not connected' : report?.status === 'submitted' ? 'Submitted' : report ? 'Draft' : 'Not started'}</span></div>
        <h3>{department.name}</h3><p>{preview ? `${progress.filled} of ${progress.total} answered` : 'Shared report unavailable'}</p>
        {preview ? <a className="vy-button vy-button-small vy-button-dark" href={`#/report/${encodeURIComponent(department.code)}/${month}`}>{report ? 'Open report' : 'Start report'}</a> : <button type="button" className="vy-button vy-button-small" disabled>Open report</button>}
      </article>
    })}</div></section>
  </>
}
