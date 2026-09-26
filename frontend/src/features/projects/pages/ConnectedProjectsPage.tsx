import { useEffect, useState } from 'react'
import { ArrowUpRight, Plus, Search } from 'lucide-react'
import { canWriteDepartment, type Access } from '@/features/auth'
import { referenceForDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { canSubmitTicket } from '@/features/tickets'
import { LiveProjectEditor } from '../components/LiveProjectEditor'
import { createLiveProject, listLiveProjects } from '../live-api'
import { filterLiveProjects, projectServiceMessage, type LiveProject } from '../live-model'
import { projectStatuses } from '../model'
import './projects.css'

export function ConnectedProjectsPage({ access, liveTaskStats }: {
  access: Access
  liveTaskStats?: { overdue: number; mine: number }
}) {
  const [rows, setRows] = useState<LiveProject[]>([])
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const organizationId = access.organization.organization_id
  const writableDepartments = access.departments.filter((item) => canWriteDepartment(access, item.code)).map(referenceForDepartment)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listLiveProjects(organizationId)
      .then((result) => { if (active) setRows(result) })
      .catch((cause: unknown) => { if (active) { setRows([]); setError(projectServiceMessage(cause)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organizationId, refresh])

  const shown = filterLiveProjects(rows, { query, departmentCode: department, status, archived: showArchived })

  return <div className="vy-project-live">
    <header className="vy-hero vy-projects-hero">
      <div><h1>Projects</h1><p>Shared projects, store tickets, and team tasks.</p></div>
      <div className="vy-hero-actions"><a className="vy-button" href="#/tasks">My tasks <ArrowUpRight size={15} /></a></div>
    </header>

    <section className="vy-project-live-list" aria-labelledby="vy-live-projects-title">
      <div className="vy-project-live-heading"><div><h2 id="vy-live-projects-title">Shared projects</h2><p>Work owned by your departments.</p></div>
        {writableDepartments.length > 0 && <button type="button" className="vy-button vy-button-dark" onClick={() => setEditorOpen(true)}><Plus size={15} /> New project</button>}
      </div>
      {rows.length > 0 && <div className="vy-project-live-filters">
        <label className="vy-project-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search recent projects" placeholder="Search recent projects" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <SelectField ariaLabel="Project department" size="compact" value={department} onChange={setDepartment} options={[{ value: '', label: 'All departments' }, ...access.departments.map((item) => ({ value: item.code, label: item.name }))]} />
        <SelectField ariaLabel="Project status" size="compact" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, ...projectStatuses]} />
        <label className="vy-project-only-mine"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />Archived</label>
      </div>}
      {error && <p className="vy-project-error" role="alert">{error}</p>}
      {loading ? <p className="vy-project-live-message" role="status">Loading projects...</p>
        : !error && (shown.length ? <ul className="vy-project-live-rows">{shown.map((project) => <li key={project.id}>
          <a href={`#/project/${project.id}`}>
            <span><strong>{project.name}</strong><small>{access.departments.find((item) => item.code === project.department_code)?.name || project.department_code}{project.due_date && ` · due ${displayDate(project.due_date)}`}</small></span>
            <span className={`vy-project-status is-${project.status}`}>{projectStatuses.find((item) => item.value === project.status)?.label}</span>
          </a>
        </li>)}</ul> : <p className="vy-project-live-message">{rows.length ? 'No recent projects match these filters.' : access.departments.length ? 'No shared projects yet.' : 'Shared projects are limited to your assigned departments.'}</p>)}
      {rows.length === 200 && <p className="vy-project-live-note">Showing the 200 most recently updated projects.</p>}
    </section>

    <section className="vy-project-live-section" aria-labelledby="vy-live-tickets-title">
      <div><h2 id="vy-live-tickets-title">Ticket desk</h2><p>Store issues you reported, were assigned, or can review.</p></div>
      <div className="vy-project-live-actions"><a className="vy-button" href="#/tickets">Open ticket desk <ArrowUpRight size={15} /></a>
        {canSubmitTicket(access) && <a className="vy-button vy-button-dark" href="#/tickets/new"><Plus size={15} /> Submit ticket</a>}</div>
    </section>

    <section className="vy-project-live-section" aria-labelledby="vy-live-tasks-title">
      <div><h2 id="vy-live-tasks-title">HQ tasks</h2><p>{liveTaskStats
        ? `${liveTaskStats.mine} assigned to you · ${liveTaskStats.overdue} overdue across visible teams`
        : 'Loading task totals...'}</p></div>
      <div className="vy-project-live-actions"><a className="vy-button" href="#/tasks">Open my tasks <ArrowUpRight size={15} /></a></div>
    </section>

    {editorOpen && <LiveProjectEditor access={access} departments={writableDepartments}
      onSave={async (draft) => { await createLiveProject(organizationId, draft); setEditorOpen(false); setRefresh((value) => value + 1) }}
      onClose={() => setEditorOpen(false)} />}
  </div>
}
