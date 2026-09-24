import { Plus, Trash2 } from 'lucide-react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { sopChecks, sopCodes, sopTypes, type SopDraft, type SopType } from '../model'

export function SopEditor({ sop, departments, saved, onChange, onSave, onCopy, onClose }: {
  sop: SopDraft
  departments: ReferenceDepartment[]
  saved: boolean
  onChange: (sop: SopDraft) => void
  onSave: () => void
  onCopy: () => void
  onClose: () => void
}) {
  const checks = sopChecks(sop)
  const passed = checks.filter((item) => item.ok).length
  function set<K extends keyof SopDraft>(key: K, value: SopDraft[K]) { onChange({ ...sop, [key]: value }) }
  return <section className="vy-sop-editor" aria-labelledby="vy-sop-editor-title">
    <div className="vy-sop-section-head"><h2 id="vy-sop-editor-title">2. Review and complete</h2><span>{passed} of {checks.length} complete · {saved ? 'Saved preview draft' : 'Unsaved changes'}</span></div>
    <div className="vy-sop-fields">
      <h3>Header</h3>
      <label className="is-wide">Title<input value={sop.title} onChange={(event) => set('title', event.target.value)} maxLength={140} /></label>
      <label>Department<SelectField value={sop.department} onChange={(value) => set('department', value)} options={[{ value: '', label: 'Choose department' }, ...departments.map((item) => ({ value: item.code, label: item.name }))]} /></label>
      <label>SOP type<SelectField value={sop.type} onChange={(value) => set('type', value as SopType)} options={sopTypes.map((item) => ({ value: item, label: item }))} /></label>
      <label>SOP number<input value={sop.sopNumber} onChange={(event) => set('sopNumber', event.target.value.toUpperCase().replace(/\s/g, ''))} placeholder={`SOP-${sopCodes[sop.department] || 'DEPT'}-001`} /></label>
      <label>Version<input value={sop.version} onChange={(event) => set('version', event.target.value)} /></label>
      <label>Owner role<input value={sop.owner} onChange={(event) => set('owner', event.target.value)} placeholder="e.g. Operations Manager" /></label>
      <label>Applies to<input value={sop.appliesTo} onChange={(event) => set('appliesTo', event.target.value)} /></label>
      <label>Effective date<DateField value={sop.effectiveDate} onChange={(value) => set('effectiveDate', value)} /></label>
      <label>Review date<DateField value={sop.reviewDate} onChange={(value) => set('reviewDate', value)} /></label>
      <p className="vy-sop-field-hint is-wide">Check the approved Drive folder before assigning a number. This preview does not reserve one.</p>
      <h3>1. Purpose</h3>
      <label className="is-wide">Why this SOP exists<textarea value={sop.purpose} onChange={(event) => set('purpose', event.target.value)} rows={3} /></label>
      <h3>2. Scope and triggers</h3>
      <label className="is-wide">Who follows it, and when<textarea value={sop.scope} onChange={(event) => set('scope', event.target.value)} rows={3} /></label>
      <h3>3. Roles and responsibilities</h3>
      <div className="vy-sop-rows is-wide">{sop.roles.map((row, index) => <div className="vy-sop-row" key={index}>
        <label>Role<input aria-label={`Role ${index + 1}`} value={row.role} onChange={(event) => set('roles', sop.roles.map((item, i) => i === index ? { ...item, role: event.target.value } : item))} /></label>
        <label>Responsibility<input aria-label={`Responsibility ${index + 1}`} value={row.owns} onChange={(event) => set('roles', sop.roles.map((item, i) => i === index ? { ...item, owns: event.target.value } : item))} /></label>
        <button type="button" className="vy-sop-icon-button" title="Remove role" aria-label={`Remove role ${index + 1}`} disabled={sop.roles.length === 1} onClick={() => set('roles', sop.roles.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
      </div>)}</div>
      <button type="button" className="vy-sop-add" onClick={() => set('roles', [...sop.roles, { role: '', owns: '' }])}><Plus size={15} /> Add role</button>
      <h3>4. Procedure</h3>
      <p className="vy-sop-field-hint is-wide">One action per step. Each step needs an owner.</p>
      <div className="vy-sop-rows is-wide">{sop.steps.map((row, index) => <div className="vy-sop-step" key={index}>
        <span className="vy-sop-step-number">{index + 1}</span>
        <label className="is-wide">What to do<textarea aria-label={`Step ${index + 1}`} value={row.text} onChange={(event) => set('steps', sop.steps.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} rows={2} /></label>
        <label>Owner<input aria-label={`Step ${index + 1} owner`} value={row.owner} onChange={(event) => set('steps', sop.steps.map((item, i) => i === index ? { ...item, owner: event.target.value } : item))} /></label>
        <label>Timing<input aria-label={`Step ${index + 1} timing`} value={row.timing} onChange={(event) => set('steps', sop.steps.map((item, i) => i === index ? { ...item, timing: event.target.value } : item))} /></label>
        <label>Evidence<input aria-label={`Step ${index + 1} evidence`} value={row.evidence} onChange={(event) => set('steps', sop.steps.map((item, i) => i === index ? { ...item, evidence: event.target.value } : item))} /></label>
        <button type="button" className="vy-sop-icon-button" title="Remove step" aria-label={`Remove step ${index + 1}`} disabled={sop.steps.length === 1} onClick={() => set('steps', sop.steps.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
      </div>)}</div>
      <button type="button" className="vy-sop-add" onClick={() => set('steps', [...sop.steps, { text: '', owner: '', timing: '', evidence: '' }])}><Plus size={15} /> Add step</button>
      <h3>5. Escalation</h3>
      <label className="is-wide">Who to contact when something goes wrong<textarea value={sop.escalation} onChange={(event) => set('escalation', event.target.value)} rows={3} /></label>
      <h3>6. Related documents</h3>
      <div className="vy-sop-rows is-wide">{sop.related.map((row, index) => <div className="vy-sop-row" key={index}><label>Document or None<input aria-label={`Related document ${index + 1}`} value={row} onChange={(event) => set('related', sop.related.map((item, i) => i === index ? event.target.value : item))} /></label><button type="button" className="vy-sop-icon-button" title="Remove document" aria-label={`Remove document ${index + 1}`} disabled={sop.related.length === 1} onClick={() => set('related', sop.related.filter((_, i) => i !== index))}><Trash2 size={15} /></button></div>)}</div>
      <button type="button" className="vy-sop-add" onClick={() => set('related', [...sop.related, ''])}><Plus size={15} /> Add document</button>
      <h3>7. Approval</h3>
      <div className="vy-sop-rows is-wide">{sop.approvals.map((row, index) => <div className="vy-sop-row" key={index}>
        <label>Approver role<input aria-label={`Approver role ${index + 1}`} value={row.role} onChange={(event) => set('approvals', sop.approvals.map((item, i) => i === index ? { ...item, role: event.target.value } : item))} /></label>
        <label>Name<input aria-label={`Approver name ${index + 1}`} value={row.name} onChange={(event) => set('approvals', sop.approvals.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label>
        <label>Date<DateField value={row.date} onChange={(value) => set('approvals', sop.approvals.map((item, i) => i === index ? { ...item, date: value } : item))} /></label>
        <button type="button" className="vy-sop-icon-button" title="Remove approver" aria-label={`Remove approver ${index + 1}`} disabled={sop.approvals.length === 1} onClick={() => set('approvals', sop.approvals.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
      </div>)}</div>
      <button type="button" className="vy-sop-add" onClick={() => set('approvals', [...sop.approvals, { role: '', name: '', date: '' }])}><Plus size={15} /> Add approver</button>
      <h3>8. Version history</h3>
      <div className="vy-sop-rows is-wide">{sop.history.map((row, index) => <div className="vy-sop-row" key={index}>
        <label>Version<input aria-label={`History version ${index + 1}`} value={row.version} onChange={(event) => set('history', sop.history.map((item, i) => i === index ? { ...item, version: event.target.value } : item))} /></label>
        <label>Date<DateField value={row.date} onChange={(value) => set('history', sop.history.map((item, i) => i === index ? { ...item, date: value } : item))} /></label>
        <label>Change<input aria-label={`History change ${index + 1}`} value={row.change} onChange={(event) => set('history', sop.history.map((item, i) => i === index ? { ...item, change: event.target.value } : item))} /></label>
        <label>By<input aria-label={`History author ${index + 1}`} value={row.by} onChange={(event) => set('history', sop.history.map((item, i) => i === index ? { ...item, by: event.target.value } : item))} /></label>
        <button type="button" className="vy-sop-icon-button" title="Remove version" aria-label={`Remove version ${index + 1}`} disabled={sop.history.length === 1} onClick={() => set('history', sop.history.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
      </div>)}</div>
      <button type="button" className="vy-sop-add" onClick={() => set('history', [...sop.history, { version: '', date: '', change: '', by: '' }])}><Plus size={15} /> Add version</button>
      {sop.referenceText && <section className="vy-sop-reference is-wide"><h3>Raw notes for reference</h3><p>{sop.referenceText}</p></section>}
    </div>
    <div className="vy-sop-editor-actions"><button type="button" className="vy-button vy-button-dark" onClick={onSave}>Save preview draft</button><button type="button" className="vy-button" onClick={onCopy}>Copy as text</button><button type="button" className="vy-button" disabled title="Word generation is not connected">Download Word file</button><button type="button" className="vy-button" onClick={onClose}>Close</button></div>
  </section>
}
