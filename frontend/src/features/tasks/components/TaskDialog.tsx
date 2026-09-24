import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Department } from '@/shared/config/departments'
import { errorText } from '@/shared/lib/format'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import type { Access } from '@/features/auth'
import { createTask, listDepartmentPeople, type HqTask, type Person } from '../api'
import './tasks.css'

export type NewTask = { departmentCode: string; title: string; details: string; dueDate: string | null; assignedTo: string | null }

// Vy's "New task" dialog, limited to the fields HQ tasks store today.
export function TaskDialog({ access, departments, initialDepartment, assignToMe = false, onClose, onCreated,
  save = (task) => createTask({ access, ...task }),
  loadPeople = listDepartmentPeople,
}: {
  access: Access; departments: Department[]; initialDepartment?: string; assignToMe?: boolean
  onClose: () => void; onCreated: (task: HqTask) => void
  save?: (task: NewTask) => Promise<HqTask>
  loadPeople?: (organizationId: string, departmentCode: string) => Promise<Person[]>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [departmentCode, setDepartmentCode] = useState(() =>
    departments.find((item) => item.code === initialDepartment)?.code || departments[0]?.code || '')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const assigneeTouched = useRef(false)
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Removing an open dialog closes it without a close event, so there's nothing to undo on unmount.
  // (Calling close() here would fire onClose when React re-runs effects in development.)
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [])

  // Teammates depend on the department. Keep the chosen person only if they're in the new list.
  useEffect(() => {
    if (!departmentCode) return
    let active = true
    setPeople([])
    loadPeople(access.organization.organization_id, departmentCode).then((list) => {
      if (!active) return
      // Admins may take tasks in any department, even ones they aren't listed in.
      const withMe = !list.some((person) => person.user_id === access.userId) && access.organization.role === 'admin'
        ? [...list, { user_id: access.userId, display_name: access.displayName }] : list
      setPeople(withMe)
      setAssignedTo((current) => {
        if (current && withMe.some((person) => person.user_id === current)) return current
        return !assigneeTouched.current && assignToMe && withMe.some((person) => person.user_id === access.userId) ? access.userId : ''
      })
    }).catch((cause) => { if (active) setError(`Could not load teammates: ${errorText(cause)}`) })
    return () => { active = false }
  }, [access, assignToMe, departmentCode, loadPeople])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !departmentCode) return
    setBusy(true); setError('')
    try {
      onCreated(await save({ departmentCode, title, details, dueDate: dueDate || null, assignedTo: assignedTo || null }))
      onClose()
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  return <dialog ref={dialog} className="vy-task-dialog" onClose={onClose} onCancel={onClose} aria-labelledby="task-dialog-title">
    <form className="vy-task-form" onSubmit={submit}>
      <h2 id="task-dialog-title">New task (you can delegate it)</h2>
      {error && <p className="vy-task-error" role="alert">{error}</p>}
      <label className="vy-task-field">Title<input autoFocus required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" /></label>
      <div className="vy-task-pair">
        <label className="vy-task-field">Department<SelectField value={departmentCode} onChange={setDepartmentCode} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label className="vy-task-field">Assign to<SelectField value={assignedTo} onChange={(next) => { assigneeTouched.current = true; setAssignedTo(next) }} options={[{ value: '', label: 'Unassigned' }, ...people.map((person) => ({ value: person.user_id, label: `${person.display_name}${person.user_id === access.userId ? ' (you)' : ''}` }))]} /></label>
      </div>
      <div className="vy-task-pair">
        <label className="vy-task-field">Due date<DateField value={dueDate} onChange={setDueDate} /></label>
      </div>
      <label className="vy-task-field">Details<textarea maxLength={4000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Context, links, what done looks like" /></label>
      <p className="vy-task-note">Projects, priority, start dates, locations, status and Drive copies will be added when HQ tasks can store them.</p>
      <div className="vy-task-foot">
        <button className="vy-button" type="button" onClick={onClose}>Cancel</button>
        <button className="vy-button vy-button-dark" type="submit" disabled={busy || !departmentCode}>{busy ? 'Saving…' : 'Save task'}</button>
      </div>
    </form>
  </dialog>
}
