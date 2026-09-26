import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Pencil } from 'lucide-react'
import type { Access } from '@/features/auth'
import { referenceForDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { LiveProjectEditor } from '../components/LiveProjectEditor'
import { getLiveProject, listProjectOwners, setLiveProjectArchived, updateLiveProject, type ProjectPerson } from '../live-api'
import { canArchiveLiveProject, canEditLiveProject, projectServiceMessage, type LiveProject } from '../live-model'
import { projectStatuses, safeProjectUrl } from '../model'
import './projects.css'

export function ConnectedProjectPage({ access, id }: { access: Access; id: string }) {
  const [project, setProject] = useState<LiveProject | null>(null)
  const [people, setPeople] = useState<ProjectPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [archivePrompt, setArchivePrompt] = useState(false)
  const [busy, setBusy] = useState(false)
  const organizationId = access.organization.organization_id

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getLiveProject(organizationId, id)
      .then((result) => {
        if (!active) return
        setProject(result)
        if (result) listProjectOwners(organizationId, result.department_code)
          .then((list) => { if (active) setPeople(list) })
          .catch(() => { if (active) setPeople([]) })
      })
      .catch((cause: unknown) => { if (active) setError(projectServiceMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organizationId, id])

  async function changeArchived() {
    if (!project) return
    setBusy(true)
    setError('')
    try { setProject(await setLiveProjectArchived(organizationId, project, !project.archived_at)) }
    catch (cause) { setError(projectServiceMessage(cause)) }
    finally { setBusy(false); setArchivePrompt(false) }
  }

  const department = project && access.departments.find((item) => item.code === project.department_code)
  const asana = project?.asana_url ? safeProjectUrl(project.asana_url) : null
  const ownerName = project?.owner_id
    ? project.owner_id === access.userId ? 'You' : people.find((person) => person.user_id === project.owner_id)?.display_name || 'Former teammate'
    : 'Unassigned'

  return <div className="vy-project-live">
    <a className="vy-project-back" href="#/projects"><ArrowLeft size={15} /> All projects</a>
    {error && <p className="vy-project-error" role="alert">{error}</p>}
    {loading ? <p className="vy-project-live-message" role="status">Loading project...</p>
      : error ? null
        : !project ? <div className="vy-project-unavailable"><h1>Project unavailable</h1><p>This project was not found or is outside your assigned departments.</p><a className="vy-button" href="#/projects">All projects</a></div>
        : <>
          <header className="vy-hero vy-project-detail-hero"><div><span className="vy-project-department">{department?.name || project.department_code}</span><h1>{project.name}</h1><p>{project.description || 'No description yet.'}</p></div>
            <div className="vy-hero-actions">{canEditLiveProject(access, project) && !project.archived_at && <button type="button" className="vy-button" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>}
              {asana && <a className="vy-button" href={asana} target="_blank" rel="noopener noreferrer">In Asana <ArrowUpRight size={14} /></a>}</div></header>
          <div className="vy-project-detail-summary"><span className={`vy-project-status is-${project.status}`}>{projectStatuses.find((item) => item.value === project.status)?.label}</span>
            {project.archived_at && <span className="vy-project-archive-label">Archived</span>}
            <span>Owner: {ownerName}</span><span>Due: {project.due_date ? displayDate(project.due_date) : 'Not set'}</span></div>
          <section className="vy-project-live-details" aria-label="Project details">
            <dl><div><dt>Department</dt><dd>{department?.name || project.department_code}</dd></div><div><dt>Owner</dt><dd>{ownerName}</dd></div>
              <div><dt>Start</dt><dd>{project.start_date ? displayDate(project.start_date) : 'Not set'}</dd></div><div><dt>Due</dt><dd>{project.due_date ? displayDate(project.due_date) : 'Not set'}</dd></div>
              <div><dt>Updated</dt><dd>{new Date(project.updated_at).toLocaleDateString()}</dd></div></dl>
          </section>
          {canArchiveLiveProject(access, project) && <div className="vy-project-live-archive">{archivePrompt
            ? <><p>{project.archived_at ? 'Restore this project to active work?' : 'Archive this project? It can be restored later.'}</p>
                <button type="button" className="vy-button" onClick={() => setArchivePrompt(false)} disabled={busy}>Cancel</button>
                <button type="button" className="vy-button vy-button-dark" onClick={changeArchived} disabled={busy}>{busy ? 'Saving...' : project.archived_at ? 'Restore' : 'Archive'}</button></>
            : <button type="button" className="vy-button" onClick={() => setArchivePrompt(true)}>{project.archived_at ? 'Restore project' : 'Archive project'}</button>}</div>}
          {editing && <LiveProjectEditor access={access} departments={department ? [referenceForDepartment(department)] : []} project={project}
            onSave={async (draft) => { setProject(await updateLiveProject(organizationId, project, draft)); setEditing(false) }}
            onClose={() => setEditing(false)} />}
        </>}
  </div>
}
