import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { todayLocal } from '@/shared/lib/format'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { TimeField } from '@/shared/ui/TimeField'
import { safeMeetingUrl, type MeetingRecord } from '../model'

export function MeetingDialog({ meeting, departments, projects, focusActions = false, onSave, onDelete, onClose }: {
  meeting?: MeetingRecord
  departments: ReferenceDepartment[]
  projects: { id: string; name: string }[]
  focusActions?: boolean
  onSave: (meeting: MeetingRecord) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLInputElement>(null)
  const actionsInput = useRef<HTMLTextAreaElement>(null)
  const [date, setDate] = useState(meeting?.date || todayLocal())
  const [time, setTime] = useState(meeting?.time || '')
  const [department, setDepartment] = useState(meeting?.department || '')
  const [projectId, setProjectId] = useState(meeting?.projectId || '')
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal(); (focusActions ? actionsInput.current : title.current)?.focus() }, [focusActions])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('title') || '').trim()
    const driveUrl = String(fields.get('driveUrl') || '').trim()
    if (!name) { setError('Enter a meeting title.'); title.current?.focus(); return }
    if (!date) { setError('Choose a date.'); return }
    if (driveUrl && !safeMeetingUrl(driveUrl)) { setError('Use an http or https link.'); return }
    onSave({
      id: meeting?.id || crypto.randomUUID(), title: name, date, time, department, projectId,
      attendees: String(fields.get('attendees') || '').trim(),
      agenda: String(fields.get('agenda') || '').trim(),
      notes: String(fields.get('notes') || '').trim(),
      decisions: String(fields.get('decisions') || '').trim(),
      actions: String(fields.get('actions') || '').trim(),
      driveUrl, savedBy: meeting?.savedBy || 'Preview',
    })
  }

  return <dialog ref={dialog} className="vy-meeting-dialog" aria-labelledby="vy-meeting-dialog-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-meeting-form" onSubmit={submit}>
      <h2 id="vy-meeting-dialog-title">{meeting ? 'Edit meeting' : 'New meeting'}</h2>
      <label>Meeting title<input ref={title} name="title" required maxLength={140} defaultValue={meeting?.title || ''} placeholder="e.g. Weekly ops review" /></label>
      <div className="vy-meeting-form-grid">
        <label>Date<DateField value={date} onChange={setDate} /></label>
        <label>Time<TimeField value={time} onChange={setTime} /></label>
        <label>Department<SelectField value={department} onChange={setDepartment} options={[{ value: '', label: 'No department' }, ...departments.map((item) => ({ value: item.code, label: item.name }))]} /></label>
        <label>Project<SelectField value={projectId} onChange={setProjectId} options={[{ value: '', label: 'No project' }, ...projects.map((item) => ({ value: item.id, label: item.name }))]} /></label>
      </div>
      <label>Who was there<input name="attendees" maxLength={300} defaultValue={meeting?.attendees || ''} placeholder="Names, comma separated" /></label>
      <label>Agenda, one line each<textarea name="agenda" rows={3} maxLength={3000} defaultValue={meeting?.agenda || ''} /></label>
      <label>Notes and what was said<textarea name="notes" rows={5} maxLength={12000} defaultValue={meeting?.notes || ''} /></label>
      <label>Decisions, one line each<textarea name="decisions" rows={3} maxLength={3000} defaultValue={meeting?.decisions || ''} /></label>
      <label>Action items, one line each<textarea ref={actionsInput} name="actions" rows={3} maxLength={3000} defaultValue={meeting?.actions || ''} placeholder="Order new cups — person — date" /></label>
      <label>Meeting file link<input name="driveUrl" type="url" defaultValue={meeting?.driveUrl || ''} placeholder="https://..." /></label>
      <p className="vy-meeting-form-hint">Action items stay in this preview meeting. They do not create HQ tasks or send email.</p>
      {error && <p className="vy-meeting-error" role="alert">{error}</p>}
      <div className="vy-meeting-dialog-actions">
        {meeting && <button type="button" className="vy-button vy-meeting-delete" onClick={() => onDelete(meeting.id)}>Delete</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button>
        <button type="submit" className="vy-button vy-button-dark">Save meeting</button>
      </div>
    </form>
  </dialog>
}
