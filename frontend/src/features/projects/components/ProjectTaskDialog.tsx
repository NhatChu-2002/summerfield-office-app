import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { projectPriorities, type ProjectPerson, type ProjectPriority, type ProjectRecord, type ProjectTask } from '../model'

export function ProjectTaskDialog({ task, kind, projectId, requireAssignee = false, departments, projects, people, onSave, onClose }: {
  task?: ProjectTask
  kind: 'task' | 'ticket'
  projectId?: string
  requireAssignee?: boolean
  departments: ReferenceDepartment[]
  projects: ProjectRecord[]
  people: ProjectPerson[]
  onSave: (task: ProjectTask) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)
  const [selectedProject, setSelectedProject] = useState(task?.projectId || projectId || '')
  const [department, setDepartment] = useState(task?.department || projects.find((item) => item.id === projectId)?.department || departments[0]?.code || '')
  const [assignee, setAssignee] = useState(task?.assignee || '')
  const [priority, setPriority] = useState<ProjectPriority>(task?.priority || 'normal')
  const [due, setDue] = useState(task?.due || '')
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal(); titleInput.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const title = String(fields.get('title') || '').trim()
    if (!title) { setError('Enter a title.'); titleInput.current?.focus(); return }
    if (requireAssignee && !assignee) { setError('Choose someone to assign this ticket to.'); return }
    onSave({ id: task?.id || crypto.randomUUID(), projectId: selectedProject, department,
      title, details: String(fields.get('details') || '').trim(),
      due, priority, status: task?.status || 'open', assignee, kind: task?.kind || kind })
  }

  return <dialog ref={dialog} className="vy-project-dialog" aria-labelledby="vy-project-task-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-project-form" onSubmit={submit}>
      <h2 id="vy-project-task-title">{task ? `Edit ${task.kind}` : kind === 'ticket' ? 'Submit a ticket' : 'Add a task'}</h2>
      <label>Title<input ref={titleInput} name="title" required maxLength={160} defaultValue={task?.title || ''} placeholder="What needs doing?" /></label>
      <div className="vy-project-form-grid">
        <label>Project<SelectField name="project" value={selectedProject} onChange={(next) => { setSelectedProject(next); const found = projects.find((item) => item.id === next); if (found) setDepartment(found.department) }} options={[{ value: '', label: 'No project' }, ...projects.map((item) => ({ value: item.id, label: item.name }))]} /></label>
        <label>Department<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Assign to<SelectField name="assignee" value={assignee} onChange={setAssignee} options={[{ value: '', label: 'Unassigned' }, ...people.map((person) => ({ value: person.id, label: person.name }))]} /></label>
        <label>Due date<DateField name="due" value={due} onChange={setDue} /></label>
        <label>Priority<SelectField name="priority" value={priority} onChange={(next) => setPriority(next as ProjectPriority)} options={projectPriorities} /></label>
      </div>
      <label>Details<textarea name="details" rows={3} maxLength={2000} defaultValue={task?.details || ''} /></label>
      {error && <p className="vy-project-error" role="alert">{error}</p>}
      <div className="vy-project-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">{task ? `Save ${task.kind}` : kind === 'ticket' ? 'Submit ticket' : 'Add task'}</button></div>
    </form>
  </dialog>
}
