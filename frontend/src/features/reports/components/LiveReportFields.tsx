import { Plus, Trash2 } from 'lucide-react'
import type { Payload, Section, Field } from '../live-schema'
import { metricGroups, metricValue, rows, scalar, setMetric, setRows, setScalar } from '../live-schema'
import type { LiveReportType } from '../live-period'

function FieldInput({ field, value, disabled, onChange }: { field: Field; value: string | boolean; disabled: boolean; onChange: (value: string | boolean) => void }) {
  if (field.kind === 'checkbox') return <label className="vy-live-report-check"><input type="checkbox" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span>{field.label}</span></label>
  return <label><span>{field.label}</span>{field.kind === 'notes'
    ? <textarea rows={3} value={String(value)} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    : field.kind === 'select'
      ? <select value={String(value)} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">Choose</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      : <input type="text" value={String(value)} disabled={disabled} onChange={(event) => onChange(event.target.value)} />}</label>
}

export function LiveReportFields({ section, code, type, payload, disabled, onChange }: {
  section: Section; code: string; type: LiveReportType; payload: Payload; disabled: boolean; onChange: (payload: Payload) => void
}) {
  if (section.metrics) return <div className="vy-live-report-metrics">{metricGroups(code, type).map((group) => <div key={group.key} className="vy-live-report-metric-group"><h3>{group.title}</h3><div className="vy-live-report-metric-grid">{group.metrics.map((metric) => {
    const value = metricValue(payload, group.key, metric.key)
    return <div key={metric.key} className="vy-live-report-metric"><div><strong>{metric.label}</strong>{metric.target && <small>Target: {metric.target}</small>}</div>{(['previous', 'current', 'note'] as const).map((field) => <label key={field}><span>{field === 'previous' ? 'Previous' : field === 'current' ? 'Current' : 'Why / action'}</span><input type="text" aria-label={`${metric.label}: ${field === 'note' ? 'Why / action' : field}`} value={typeof value[field] === 'string' ? value[field] : ''} disabled={disabled} onChange={(event) => onChange(setMetric(payload, group.key, metric.key, field, event.target.value, metric.label, metric.target))} /></label>)}</div>
  })}</div></div>)}</div>
  if (section.repeatable) {
    const items = rows(payload, section.key)
    return <div className="vy-live-report-rows">{items.map((item, index) => <div key={index} className="vy-live-report-row"><div className="vy-report-fields">{section.fields?.map((field) => <FieldInput key={field.key} field={field} value={item[field.key] || ''} disabled={disabled} onChange={(value) => onChange(setRows(payload, section.key, items.map((row, rowIndex) => rowIndex === index ? { ...row, [field.key]: String(value) } : row)))} />)}</div>{!disabled && <button className="vy-live-report-icon" type="button" aria-label={`Remove row ${index + 1}`} title="Remove row" onClick={() => onChange(setRows(payload, section.key, items.filter((_, rowIndex) => rowIndex !== index)))}><Trash2 size={16} /></button>}</div>)}
      {!disabled && <button type="button" className="vy-button vy-button-small" onClick={() => onChange(setRows(payload, section.key, [...items, {}]))}><Plus size={15} /> Add row</button>}</div>
  }
  return <div className="vy-report-fields">{section.fields?.map((field) => <FieldInput key={field.key} field={field} value={scalar(payload, section.key, field.key)} disabled={disabled} onChange={(value) => onChange(setScalar(payload, section.key, field.key, value))} />)}</div>
}
