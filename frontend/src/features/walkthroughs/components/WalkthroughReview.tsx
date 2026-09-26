import { Plus, Trash2 } from 'lucide-react'
import { DateField } from '@/shared/ui/DateField'
import type { InspectionForm, Finding } from '../form-model'
import { inspectionStats } from '../form-model'
import { teamNotes } from '../template'

export function WalkthroughReview({ form, editable, onMeta, onFindings }: {
  form: InspectionForm; editable: boolean
  onMeta: (key: keyof InspectionForm['meta'], value: string) => void
  onFindings: (findings: Finding[]) => void
}) {
  const stats = inspectionStats(form)
  const updateFinding = (index: number, field: keyof Finding, value: string) => onFindings(form.findings.map((finding, row) => row === index ? { ...finding, [field]: value } : finding))
  return <div className="vy-walk-review">
    <section aria-label="Score summary">
      <div className="vy-walk-check-head"><div><span className="vy-walk-kicker">Review</span><h2>Score</h2></div><strong className="vy-walk-score">{stats.score === null ? 'Not scored' : `${stats.score} / 100${stats.grade ? ` · ${stats.grade}` : ''}`}</strong></div>
      <div className="vy-walk-review-grid"><span>Section</span><span>Answered</span><span>Points</span>{stats.sections.map((section) => <div className="vy-walk-review-row" key={section.lane.id}><strong>{section.lane.name}</strong><span>{section.answered} / {section.items}</span><span>{section.points === null ? 'Not scored' : `${section.points.toFixed(1)} / ${section.lane.max}`}</span></div>)}</div>
      <p className="vy-walk-message">Food safety: {stats.safetyAnswered} / 10 answered · {stats.safetyFails} failed. Safety is a separate escalation gate and does not add points.</p>
    </section>
    <section aria-label="Manager discussion"><h2>Manager discussion</h2><div className="vy-walk-form-grid">
      {([['q1', 'What went well in your store today?'], ['q2', "What didn't?"], ['q3', "What would you have preferred we didn't see?"]] as const).map(([field, label]) => <label className="vy-walk-wide" key={field}>{label}<textarea value={form.meta[field]} onChange={(event) => onMeta(field, event.target.value)} disabled={!editable} rows={2} maxLength={2000} /></label>)}
    </div></section>
    <section aria-label="Findings and actions"><div className="vy-walk-check-head"><h2>Findings and actions</h2>{editable && <button className="vy-walk-refresh" type="button" aria-label="Add finding" title="Add finding" onClick={() => onFindings([...form.findings, { text: '', owner: '', due: '' }])}><Plus size={17} /></button>}</div>
      <div className="vy-walk-findings">{form.findings.map((finding, index) => <div className="vy-walk-finding" key={index}>
        <div className="vy-walk-finding-head"><strong>Finding {index + 1}</strong>{editable && form.findings.length > 1 && <button type="button" aria-label={`Remove finding ${index + 1}`} title="Remove finding" onClick={() => onFindings(form.findings.filter((_item, row) => row !== index))}><Trash2 size={16} /></button>}</div>
        <div className="vy-walk-form-grid"><label className="vy-walk-wide">What needs to be fixed<textarea value={finding.text} onChange={(event) => updateFinding(index, 'text', event.target.value)} disabled={!editable} rows={2} maxLength={2000} /></label>
          <label>To be fixed by<input value={finding.owner} onChange={(event) => updateFinding(index, 'owner', event.target.value)} disabled={!editable} maxLength={250} /></label>
          <label>Due date<DateField value={finding.due} onChange={(value) => updateFinding(index, 'due', value)} disabled={!editable} /></label>
        </div>
      </div>)}</div>
      <div className="vy-walk-form-grid vy-walk-followup"><label>Follow-up carried out by<input value={form.meta.followBy} onChange={(event) => onMeta('followBy', event.target.value)} disabled={!editable} maxLength={250} /></label><label>Follow-up due by<DateField value={form.meta.followDate} onChange={(value) => onMeta('followDate', value)} disabled={!editable} /></label></div>
    </section>
    <section aria-label="Internal team notes"><h2>Internal team notes</h2><div className="vy-walk-form-grid">{teamNotes.map(([key, label]) => <label className="vy-walk-wide" key={key}>{label}<textarea value={form.meta[`team_${key}`]} onChange={(event) => onMeta(`team_${key}`, event.target.value)} disabled={!editable} rows={2} maxLength={2000} /></label>)}</div></section>
  </div>
}
