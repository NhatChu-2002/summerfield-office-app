import { useEffect, useRef } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { reportSchema } from '../schema'
import { monthLabel, type ReportRecord } from '../model'

export function PresentationDialog({ department, report, onClose }: {
  department: ReferenceDepartment
  report: ReportRecord
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="vy-report-presentation" aria-labelledby="vy-report-presentation-title" onCancel={onClose} onClose={onClose}>
    <header><span>{department.name} · {monthLabel(report.month)}</span><button type="button" className="vy-button" onClick={onClose}>Close</button></header>
    <h2 id="vy-report-presentation-title">{report.values.accomplish || 'Report preview'}</h2>
    {report.values.improve && <p className="vy-report-presentation-lead">Needs improvement: {report.values.improve}</p>}
    {reportSchema(report.department).map((section) => {
      const answered = section.fields.filter((field) => (report.values[field.key] || '').trim())
      return answered.length ? <section key={section.title}><h3>{section.title}</h3><dl>{answered.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{report.values[field.key]}</dd></div>)}</dl></section> : null
    })}
  </dialog>
}
