import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { projectStatuses, safeProjectUrl, type ProjectPerson, type ProjectRecord, type ProjectStatus } from '../model'

export function ProjectDialog({ project, departments, people, currentUser, onSave, onDelete, onClose }: {
  project?: ProjectRecord
  departments: ReferenceDepartment[]
  people: ProjectPerson[]
  currentUser: string
  onSave: (project: ProjectRecord) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(project?.department || departments[0]?.code || '')
  const [manager, setManager] = useState(project?.manager ?? currentUser)
  const [start, setStart] = useState(project?.start || '')
  const [due, setDue] = useState(project?.due || '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'track')
  const [members, setMembers] = useState(project?.members || [])
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal(); nameInput.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') || '').trim()
    const asanaUrl = String(fields.get('asanaUrl') || '').trim()
    if (!name) { setError('Enter a project name.'); nameInput.current?.focus(); return }
    if (start && due && due < start) { setError('Due date must be on or after the start date.'); return }
    if (asanaUrl && !safeProjectUrl(asanaUrl)) { setError('Enter an http or https Asana link.'); return }
    onSave({ id: project?.id || crypto.randomUUID(), name, department, manager, members, start, due, status,
      asanaUrl, notes: String(fields.get('notes') || '').trim() })
  }

  return <dialog ref={dialog} className="vy-project-dialog" aria-labelledby="vy-project-dialog-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-project-form" onSubmit={submit}>
      <h2 id="vy-project-dialog-title">{project ? 'Project settings' : 'New project'}</h2>
      <label>Project name<input ref={nameInput} name="name" required maxLength={120} defaultValue={project?.name || ''} /></label>
      <div className="vy-project-form-grid">
        <label>Department<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Project manager<SelectField name="manager" value={manager} onChange={setManager} options={[{ value: '', label: 'No manager yet' }, ...people.map((person) => ({ value: person.id, label: person.name }))]} /></label>
        <label>Start<DateField name="start" value={start} onChange={setStart} /></label>
        <label>Due<DateField name="due" value={due} onChange={setDue} min={start || undefined} /></label>
        <label>Status<SelectField name="status" value={status} onChange={(next) => setStatus(next as ProjectStatus)} options={projectStatuses} /></label>
        <label>Asana link (optional)<input name="asanaUrl" type="url" placeholder="https://app.asana.com/..." defaultValue={project?.asanaUrl || ''} /></label>
      </div>
      <label>What this project is<textarea name="notes" rows={3} maxLength={2000} defaultValue={project?.notes || ''} /></label>
      <fieldset className="vy-project-members"><legend>Who's on it</legend>{people.map((person) => <label key={person.id}><input type="checkbox" checked={members.includes(person.id)} onChange={(event) => setMembers((list) => event.target.checked ? [...list, person.id] : list.filter((id) => id !== person.id))} />{person.name}</label>)}</fieldset>
      {error && <p className="vy-project-error" role="alert">{error}</p>}
      <div className="vy-project-dialog-actions">{project && <button type="button" className="vy-button vy-project-remove" onClick={() => onDelete(project.id)}>Delete</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save project</button></div>
    </form>
  </dialog>
}
