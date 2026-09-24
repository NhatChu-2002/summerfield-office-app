import { useState } from 'react'
import { ArrowLeft, Presentation } from 'lucide-react'
import { departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { PresentationDialog } from '../components/PresentationDialog'
import { monthLabel, reportId, reportInputType, reportProgress, type ReportRecord } from '../model'
import { reportSchema } from '../schema'
import './reports.css'

export default function ReportPage({ departmentCode, month, departments, reports, preview, onReportsChange }: {
  departmentCode: string
  month: string
  departments: ReferenceDepartment[]
  reports: ReportRecord[]
  preview: boolean
  onReportsChange?: (reports: ReportRecord[]) => void
}) {
  const [error, setError] = useState('')
  const [presenting, setPresenting] = useState(false)
  const department = departments.find((item) => item.code === departmentCode)
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  if (!department || !validMonth) return <div className="vy-report-unavailable"><h1>Report unavailable</h1><a className="vy-button" href="#/reports">All reports</a></div>
  if (!preview) return <div className="vy-report-unavailable"><h1>{department.name} report</h1><p>Shared monthly reports are not connected yet.</p><a className="vy-button" href={`#/reports/${month}`}>All reports</a></div>

  const id = reportId(departmentCode, month)
  const report = reports.find((item) => item.id === id)
  const values = report?.values || {}
  const progress = reportProgress(departmentCode, values)
  const submitted = report?.status === 'submitted'

  function updateField(key: string, value: string) {
    const next: ReportRecord = { id, department: departmentCode, month, status: 'draft', values: { ...values, [key]: value }, updatedAt: new Date().toISOString() }
    onReportsChange?.([...reports.filter((item) => item.id !== id), next])
    setError('')
  }

  function toggleSubmit() {
    if (!submitted && progress.missing.length) {
      setError(`Still needed: ${progress.missing.map((field) => field.label).join('; ')}.`)
      return
    }
    const next: ReportRecord = { id, department: departmentCode, month, status: submitted ? 'draft' : 'submitted', values, updatedAt: new Date().toISOString() }
    onReportsChange?.([...reports.filter((item) => item.id !== id), next])
    setError('')
  }

  return <>
    <a className="vy-report-back" href={`#/reports/${month}`}><ArrowLeft size={15} /> All reports</a>
    <header className="vy-hero vy-report-detail-hero" style={departmentStyle(department.color)}><div><h1>{department.name} · {monthLabel(month)}</h1><p>{progress.filled} of {progress.total} answered · {submitted ? 'Submitted in preview' : 'Preview draft'}</p></div><div className="vy-hero-actions"><button type="button" className="vy-button vy-button-dark" onClick={toggleSubmit}>{submitted ? 'Reopen draft' : 'Submit preview report'}</button><button type="button" className="vy-button" disabled={!report} onClick={() => setPresenting(true)}><Presentation size={15} /> Present</button></div></header>
    <p className="vy-report-status">Changes stay in this Design preview until you reload. Submission does not create tasks or notify anyone.</p>
    {error && <p role="alert" className="vy-report-error">{error}</p>}
    <div className="vy-report-editor-intro"><h2>Executive summary</h2><p>AI writing and HQ activity totals are not connected. Fill in the team's answers below; the presentation view uses only what you enter.</p></div>
    <div className="vy-report-editor">{reportSchema(departmentCode).map((section) => <section key={section.title} aria-label={section.title}><h2>{section.title}</h2><div className="vy-report-fields">{section.fields.map((field) => <label key={field.key} className={field.kind === 'notes' ? 'is-wide' : ''}>
      <span>{field.label}{field.required && <em>Required</em>}</span>
      {field.kind === 'notes' ? <textarea rows={3} value={values[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)} disabled={submitted} /> : <input type={reportInputType(field)} inputMode={field.kind === 'text' ? 'text' : 'decimal'} step={field.kind === 'text' ? undefined : 'any'} value={values[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)} disabled={submitted} />}
    </label>)}</div></section>)}</div>
    {submitted && <p className="vy-report-locked">This preview report is submitted. Reopen the draft to change its answers.</p>}
    {presenting && report && <PresentationDialog department={department} report={report} onClose={() => setPresenting(false)} />}
  </>
}
