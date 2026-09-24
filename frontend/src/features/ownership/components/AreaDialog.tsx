import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { contactMethods, safeSopUrl, type OwnershipArea, type Person } from '../model'

export function AreaDialog({ area, departments, people, onSave, onDelete, onClose }: {
  area?: OwnershipArea
  departments: ReferenceDepartment[]
  people: Person[]
  onSave: (area: OwnershipArea) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(area?.department || departments[0]?.code || '')
  const [owner, setOwner] = useState(area?.owner || '')
  const [backup, setBackup] = useState(area?.backup || '')
  const [how, setHow] = useState(area?.how || 'ticket')
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal(); input.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const get = (key: string) => String(fields.get(key) || '').trim()
    const topic = get('topic')
    if (!topic) { setError('Enter the area people should search for.'); input.current?.focus(); return }
    const sop = get('sop')
    if (sop && !safeSopUrl(sop)) { setError('Enter an http or https SOP link.'); return }
    onSave({ id: area?.id || crypto.randomUUID(), topic, department, owner, backup, how,
      sla: get('sla'), keywords: get('keywords').split(',').map((word) => word.trim()).filter(Boolean),
      sop, notes: get('notes') })
  }

  const personOptions = [{ value: '', label: 'Not set' }, ...people.map((person) => ({ value: person.id, label: person.name }))]
  return <dialog ref={dialog} className="vy-own-dialog" aria-labelledby="vy-area-dialog-title" onClose={onClose} onCancel={onClose}>
    <form className="vy-own-form" onSubmit={submit}>
      <h2 id="vy-area-dialog-title">{area ? `Who to ask: ${area.topic}` : 'Add an area'}</h2>
      <p>People search these words, so use the ones they would actually type.</p>
      <div className="vy-own-form-grid">
        <label>The area<input ref={input} name="topic" required maxLength={120} defaultValue={area?.topic || ''} placeholder="e.g. Equipment breakdowns" /></label>
        <label>Department<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Who owns it<SelectField name="owner" value={owner} onChange={setOwner} options={personOptions} /></label>
        <label>Who covers when they are away<SelectField name="backup" value={backup} onChange={setBackup} options={personOptions} /></label>
        <label>How to ask<SelectField name="how" value={how} onChange={setHow} options={contactMethods} /></label>
        <label>How fast to expect a reply<input name="sla" maxLength={80} defaultValue={area?.sla || ''} placeholder="same day, 48 hours" /></label>
        <label>Words people might use<input name="keywords" maxLength={300} defaultValue={area?.keywords.join(', ') || ''} placeholder="broken, leaking, not working" /></label>
        <label>Link to the SOP or folder<input name="sop" type="url" defaultValue={area?.sop || ''} /></label>
        <label className="vy-own-wide">Anything else<textarea name="notes" rows={2} maxLength={400} defaultValue={area?.notes || ''} /></label>
      </div>
      {error && <p className="vy-own-error" role="alert">{error}</p>}
      <div className="vy-own-dialog-actions">{area && <button type="button" className="vy-button vy-own-remove" onClick={() => onDelete(area.id)}>Remove</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">{area ? 'Save' : 'Add'}</button></div>
    </form>
  </dialog>
}
