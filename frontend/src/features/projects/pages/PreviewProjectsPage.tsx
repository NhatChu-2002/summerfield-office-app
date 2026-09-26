import { useState } from 'react'
import { Search } from 'lucide-react'
import { companyDepartment, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate, todayLocal } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectDialog } from '../components/ProjectDialog'
import { ProjectTaskDialog } from '../components/ProjectTaskDialog'
import { filterProjects, projectStatuses, projectSummary, type ProjectPerson, type ProjectRecord, type ProjectTask } from '../model'
import './projects.css'

export function PreviewProjectsPage({ departments, people, currentUser, projects, tasks, ticketManager, onTicketManagerChange, onProjectsChange, onTasksChange }: {
  departments: ReferenceDepartment[]
  people: ProjectPerson[]
  currentUser: string
  projects: ProjectRecord[]
  tasks: ProjectTask[]
  ticketManager?: string
  onTicketManagerChange?: (id: string) => void
  onProjectsChange?: (projects: ProjectRecord[]) => void
  onTasksChange?: (tasks: ProjectTask[]) => void
}) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [editor, setEditor] = useState<string | null>(null)
  const [ticketEditor, setTicketEditor] = useState<string | null>(null)
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const byCode = (code: string) => allDepartments.find((item) => item.code === code) || companyDepartment
  const shown = filterProjects(projects, { query, department, status, mineId: onlyMine ? currentUser : undefined })
  const summary = projectSummary(projects, tasks, currentUser, todayLocal())
  const waiting = tasks.filter((task) => task.kind === 'ticket' && task.status === 'open' && !task.assignee)
  const selectedProject = projects.find((item) => item.id === editor)
  const selectedTicket = tasks.find((item) => item.id === ticketEditor)

  function saveProject(project: ProjectRecord) {
    onProjectsChange?.(selectedProject ? projects.map((item) => item.id === project.id ? project : item) : [...projects, project])
    setEditor(null)
  }
  function deleteProject(id: string) {
    onProjectsChange?.(projects.filter((item) => item.id !== id))
    onTasksChange?.(tasks.map((task) => task.projectId === id ? { ...task, projectId: '' } : task))
    setEditor(null)
  }
  function saveTicket(task: ProjectTask) {
    onTasksChange?.(selectedTicket ? tasks.map((item) => item.id === task.id ? task : item) : [...tasks, task])
    setTicketEditor(null)
  }

  return <>
    <header className="vy-hero vy-projects-hero"><div><h1>Projects</h1><p>Every running project, who owns it, and what is due. Set up like your Asana: same priorities, statuses and sections.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" onClick={() => setTicketEditor('new')}>Submit a ticket</button><button type="button" className="vy-button vy-button-dark" onClick={() => setEditor('new')}>New project</button><a className="vy-button" href="#/tasks">My tasks</a></div></header>
    <p className="vy-projects-status">Sample design data. Projects, tickets, and task changes stay in this preview until you reload.</p>
    <div className="vy-project-stats" aria-label="Project summary">
      <div><strong>{summary.running}</strong><span>Running projects</span></div>
      <div><strong>{summary.overdue}</strong><span>Overdue tasks</span></div>
      <div><strong>{summary.tickets}</strong><span>Tickets waiting to be assigned</span></div>
      <div><strong>{summary.mine}</strong><span>Open tasks assigned to you</span></div>
    </div>
    <div className="vy-project-toolbar"><label className="vy-project-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></label>
      <SelectField ariaLabel="Department" size="compact" value={department} onChange={setDepartment} options={[{ value: '', label: 'All departments' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} />
      <SelectField ariaLabel="Status" size="compact" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, ...projectStatuses]} />
      <label className="vy-project-only-mine"><input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />Only mine</label></div>
    {shown.length ? <div className="vy-project-grid">{shown.map((project) => <ProjectCard key={project.id} project={project} tasks={tasks} people={people} department={byCode(project.department)} today={todayLocal()} />)}</div>
      : <p className="vy-project-empty">{projects.length ? 'No projects match these filters.' : 'No projects yet. Create the first one.'}</p>}
    <section className="vy-ticket-desk" aria-labelledby="vy-ticket-desk-title"><div className="vy-ticket-desk-head"><div><h2 id="vy-ticket-desk-title">Ticket desk</h2><p>{ticketManager ? `${people.find((person) => person.id === ticketManager)?.name || 'Project manager'} keeps these moving.` : 'No project manager set yet.'}</p></div><label>Project manager<SelectField ariaLabel="Project manager" size="compact" value={ticketManager || ''} onChange={(next) => onTicketManagerChange?.(next)} options={[{ value: '', label: 'Not set' }, ...people.map((person) => ({ value: person.id, label: person.name }))]} /></label></div>
      {waiting.length ? <ul className="vy-ticket-list">{waiting.map((task) => <li key={task.id}><div><strong>{task.title}</strong><span>{byCode(task.department).name}{task.due && ` · due ${displayDate(task.due)}`}</span></div><button type="button" className="vy-button vy-button-small" onClick={() => setTicketEditor(task.id)}>Assign</button></li>)}</ul> : <p className="vy-project-empty">No tickets waiting. Good place to be.</p>}
    </section>
    {editor && <ProjectDialog key={editor} project={selectedProject} departments={allDepartments} people={people} currentUser={currentUser} onSave={saveProject} onDelete={deleteProject} onClose={() => setEditor(null)} />}
    {ticketEditor && <ProjectTaskDialog key={ticketEditor} task={selectedTicket} kind="ticket" requireAssignee={!!selectedTicket} departments={allDepartments} projects={projects} people={people} onSave={saveTicket} onClose={() => setTicketEditor(null)} />}
  </>
}
