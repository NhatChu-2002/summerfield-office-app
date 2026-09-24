import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { decisionGroups, type DecisionRule, type Person } from '../model'

export function DecisionDialog({ rule, departments, people, onSave, onDelete, onClose }: {
  rule?: DecisionRule
  departments: ReferenceDepartment[]
  people: Person[]
  onSave: (rule: DecisionRule) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [group, setGroup] = useState(rule?.group || 'Money')
  const [department, setDepartment] = useState(rule?.department || departments[0]?.code || '')
  const [decider, setDecider] = useState(rule?.decider || '')
  const [escalate, setEscalate] = useState(rule?.escalate || '')
  useEffect(() => { dialog.current?.showModal(); input.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const get = (key: string) => String(fields.get(key) || '').trim()
    onSave({ id: rule?.id || crypto.randomUUID(), group, decision: get('decision'), department, decider,
      limit: get('limit'), escalate, consult: get('consult'), inform: get('inform'),
      keywords: get('keywords').split(',').map((word) => word.trim()).filter(Boolean), notes: get('notes') })
  }

  const personOptions = [{ value: '', label: 'Not set' }, ...people.map((person) => ({ value: person.id, label: person.name }))]
  return <dialog ref={dialog} className="vy-own-dialog" aria-labelledby="vy-decision-dialog-title" onClose={onClose} onCancel={onClose}>
    <form className="vy-own-form" onSubmit={submit}>
      <h2 id="vy-decision-dialog-title">{rule ? rule.decision : 'Add a decision'}</h2>
      <p>Say who decides, up to what limit, and who decides above it.</p>
      <div className="vy-own-form-grid">
        <label>Group<SelectField name="group" value={group} onChange={setGroup} options={decisionGroups.map((value) => ({ value, label: value }))} /></label>
        <label>The decision<input ref={input} name="decision" required maxLength={140} defaultValue={rule?.decision || ''} placeholder="e.g. Approve a repair" /></label>
        <label>Department<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Who decides<SelectField name="decider" value={decider} onChange={setDecider} options={personOptions} /></label>
        <label>Limit<input name="limit" maxLength={100} defaultValue={rule?.limit || ''} placeholder="up to $500" /></label>
        <label>Who decides above that limit<SelectField name="escalate" value={escalate} onChange={setEscalate} options={personOptions} /></label>
        <label>Who they check with first<input name="consult" maxLength={100} defaultValue={rule?.consult || ''} /></label>
        <label>Who gets told afterwards<input name="inform" maxLength={100} defaultValue={rule?.inform || ''} /></label>
        <label className="vy-own-wide">Words people might use<input name="keywords" maxLength={300} defaultValue={rule?.keywords.join(', ') || ''} /></label>
        <label className="vy-own-wide">Anything else<textarea name="notes" rows={2} maxLength={400} defaultValue={rule?.notes || ''} /></label>
      </div>
      <div className="vy-own-dialog-actions">{rule && <button type="button" className="vy-button vy-own-remove" onClick={() => onDelete(rule.id)}>Remove</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">{rule ? 'Save' : 'Add'}</button></div>
    </form>
  </dialog>
}
