import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Department } from '@/shared/config/departments'
import { errorText } from '@/shared/lib/format'
import { Notice } from '@/shared/ui/Notice'
import type { Access } from '@/features/auth'
import { createTask, listDepartmentPeople, type HqTask, type Person } from '../api'

export function TaskDialog({ access, department, onClose, onCreated }: {
  access: Access; department: Department; onClose: () => void; onCreated: (task: HqTask) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    listDepartmentPeople(access.organization.organization_id, department.code)
      .then(setPeople).catch((cause) => setError(`Could not load teammates: ${errorText(cause)}`))
    return () => element?.close()
  }, [access.organization.organization_id, department.code])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true); setError('')
    try {
      const task = await createTask({
        access, departmentCode: department.code, title, details,
        dueDate: dueDate || null, assignedTo: assignedTo || null,
      })
      onCreated(task)
      onClose()
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  return <dialog ref={dialog} className="dialog" onClose={onClose} onCancel={onClose} aria-labelledby="task-dialog-title">
    <div className="dialog-head"><div><p className="eyebrow">{department.name}</p><h2 id="task-dialog-title">New task</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
    <form onSubmit={submit} className="dialog-form">
      {error && <Notice>{error}</Notice>}
      <label>Task<input autoFocus maxLength={140} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" /></label>
      <label>Details <span className="optional">Optional</span><textarea maxLength={4000} rows={4} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add the context someone needs to finish this" /></label>
      <div className="form-grid"><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label>Assign to<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Unassigned</option>{people.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name}</option>)}</select></label></div>
      <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy} type="submit">{busy ? 'Saving…' : 'Create task'}</button></div>
    </form>
  </dialog>
}
