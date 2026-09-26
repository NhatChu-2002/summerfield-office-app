import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Access } from '@/features/auth'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { listProjectOwners, type ProjectPerson } from '../live-api'
import { projectServiceMessage, validateProjectDraft, type LiveProject, type ProjectDraft } from '../live-model'
import { projectStatuses, type ProjectStatus } from '../model'

export function LiveProjectEditor({ access, departments, project, onSave, onClose }: {
  access: Access
  departments: ReferenceDepartment[]
  project?: LiveProject
  onSave: (draft: ProjectDraft) => Promise<void>
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(project?.department_code || departments[0]?.code || '')
  const [people, setPeople] = useState<ProjectPerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [peopleReady, setPeopleReady] = useState(false)
  const [owner, setOwner] = useState(project ? project.owner_id || '' : access.userId)
  const [start, setStart] = useState(project?.start_date || '')
  const [due, setDue] = useState(project?.due_date || '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'track')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal(); nameInput.current?.focus() }, [])
  useEffect(() => {
    if (!department) return
    let active = true
    setLoadingPeople(true)
    setPeopleReady(false)
    setPeople([])
    listProjectOwners(access.organization.organization_id, department)
      .then((result) => { if (active) { setPeople(result); setPeopleReady(true); setError('') } })
      .catch((cause: unknown) => { if (active) setError(projectServiceMessage(cause)) })
      .finally(() => { if (active) setLoadingPeople(false) })
    return () => { active = false }
  }, [access.organization.organization_id, department])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const draft: ProjectDraft = {
      departmentCode: department,
      name: String(fields.get('name') || '').trim(),
      description: String(fields.get('description') || '').trim(),
      status,
      ownerId: owner || null,
      startDate: start || null,
      dueDate: due || null,
      asanaUrl: String(fields.get('asanaUrl') || '').trim() || null,
    }
    const validation = validateProjectDraft(draft)
    if (validation) { setError(validation); return }
    if (owner && !people.some((person) => person.user_id === owner)) {
      setError('This owner no longer has project access. Choose another owner or leave it unassigned.')
      return
    }
    setSaving(true)
    setError('')
    try { await onSave(draft) }
    catch (cause) { setError(projectServiceMessage(cause)) }
    finally { setSaving(false) }
  }

  return <dialog ref={dialog} className="vy-project-dialog" aria-labelledby="vy-live-project-editor-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-project-form" onSubmit={submit}>
      <h2 id="vy-live-project-editor-title">{project ? 'Edit project' : 'New project'}</h2>
      <label>Project name<input ref={nameInput} name="name" required maxLength={120} defaultValue={project?.name || ''} /></label>
      <div className="vy-project-form-grid">
        <label>Department{project ? <strong className="vy-project-fixed-field">{departments.find((item) => item.code === department)?.name || department}</strong>
          : <SelectField ariaLabel="Department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} />}</label>
        <label>Owner<SelectField ariaLabel="Project owner" value={owner} onChange={setOwner} disabled={loadingPeople} options={[{ value: '', label: project ? 'Unassigned' : 'Me' }, ...people.map((person) => ({ value: person.user_id, label: person.display_name })), ...(owner && !people.some((person) => person.user_id === owner) ? [{ value: owner, label: 'Former owner (reassign)' }] : [])]} /></label>
        <label>Start<DateField value={start} onChange={setStart} /></label>
        <label>Due<DateField value={due} onChange={setDue} min={start || undefined} /></label>
        {project && <label>Status<SelectField ariaLabel="Project status" value={status} onChange={(value) => setStatus(value as ProjectStatus)} options={projectStatuses} /></label>}
        <label>Asana link (optional)<input name="asanaUrl" type="url" placeholder="https://app.asana.com/..." defaultValue={project?.asana_url || ''} /></label>
      </div>
      <label>Description<textarea name="description" rows={4} maxLength={2000} defaultValue={project?.description || ''} /></label>
      {error && <p className="vy-project-error" role="alert">{error}</p>}
      <div className="vy-project-dialog-actions"><button type="button" className="vy-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="vy-button vy-button-dark" disabled={saving || !peopleReady || !department}>{saving ? 'Saving...' : 'Save project'}</button></div>
    </form>
  </dialog>
}
