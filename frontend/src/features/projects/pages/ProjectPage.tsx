import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Plus } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate, todayLocal } from '@/shared/lib/format'
import { ProjectDialog } from '../components/ProjectDialog'
import { ProjectTaskDialog } from '../components/ProjectTaskDialog'
import { projectProgress, projectStatuses, projectTaskGroups, safeProjectUrl, type ProjectMessage, type ProjectPerson, type ProjectRecord, type ProjectTask } from '../model'
import './projects.css'

type Tab = 'tasks' | 'chat' | 'files' | 'details'

export function ProjectPage({ id, departments, people, currentUser, projects, tasks, messages, preview, onProjectsChange, onTasksChange, onMessagesChange }: {
  id: string
  departments: ReferenceDepartment[]
  people: ProjectPerson[]
  currentUser: string
  projects: ProjectRecord[]
  tasks: ProjectTask[]
  messages: ProjectMessage[]
  preview: boolean
  onProjectsChange?: (projects: ProjectRecord[]) => void
  onTasksChange?: (tasks: ProjectTask[]) => void
  onMessagesChange?: (messages: ProjectMessage[]) => void
}) {
  const [tab, setTab] = useState<Tab>('tasks')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [taskEditor, setTaskEditor] = useState<string | null>(null)
  const project = projects.find((item) => item.id === id)
  if (!project) return <div className="vy-project-unavailable"><h1>Project unavailable</h1><p>{preview ? 'This project may have been removed from the preview.' : 'Shared project data is not connected yet.'}</p><a className="vy-button" href="#/projects">All projects</a></div>

  const department = [companyDepartment, ...departments].find((item) => item.code === project.department) || companyDepartment
  const relatedTasks = tasks.filter((task) => task.projectId === id)
  const progress = projectProgress(id, tasks, todayLocal())
  const groups = projectTaskGroups(relatedTasks)
  const asana = safeProjectUrl(project.asanaUrl)
  const selectedTask = relatedTasks.find((task) => task.id === taskEditor)
  const personName = (userId: string) => people.find((person) => person.id === userId)?.name || (userId === currentUser ? 'You' : 'Unassigned')

  function saveTask(task: ProjectTask) {
    onTasksChange?.(selectedTask ? tasks.map((item) => item.id === task.id ? task : item) : [...tasks, task])
    setTaskEditor(null)
  }
  function toggleTask(task: ProjectTask) {
    onTasksChange?.(tasks.map((item) => item.id === task.id ? { ...item, status: task.status === 'done' ? 'open' : 'done' } : item))
  }
  function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const text = String(new FormData(form).get('message') || '').trim()
    if (!text) return
    onMessagesChange?.([...messages, { id: crypto.randomUUID(), projectId: id, author: currentUser, text, at: new Date().toISOString() }])
    form.reset()
  }
  function deleteProject(projectId: string) {
    onProjectsChange?.(projects.filter((item) => item.id !== projectId))
    onTasksChange?.(tasks.map((task) => task.projectId === projectId ? { ...task, projectId: '' } : task))
    window.location.hash = '#/projects'
  }

  return <>
    <a className="vy-project-back" href="#/projects"><ArrowLeft size={15} /> All projects</a>
    <header className="vy-hero vy-project-detail-hero" style={departmentStyle(department.color)}><div><span className="vy-project-department" style={departmentStyle(department.color)}>{department.name}</span><h1>{project.name}</h1><p>{project.notes || 'No project description yet.'}</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" disabled={!preview} onClick={() => setTaskEditor('new')}><Plus size={15} /> Add task</button><button type="button" className="vy-button" disabled={!preview} onClick={() => setSettingsOpen(true)}>Project settings</button>{asana && <a className="vy-button" href={asana} target="_blank" rel="noopener noreferrer">In Asana <ArrowUpRight size={14} /></a>}</div></header>
    <div className="vy-project-detail-summary"><span className={`vy-project-status is-${project.status}`}>{projectStatuses.find((item) => item.value === project.status)?.label}</span><span>Manager: {project.manager ? personName(project.manager) : 'Not set'}</span><span>Due: {project.due ? displayDate(project.due) : 'Not set'}</span><span>{progress.done} of {progress.total} tasks done</span></div>
    <div className="vy-project-progress" role="img" aria-label={`${progress.percent}% of tasks done`}><span style={{ width: `${progress.percent}%` }} /></div>
    <div className="vy-project-tabs" role="tablist" aria-label="Project views">{(['tasks', 'chat', 'files', 'details'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
    <section className="vy-project-panel" role="tabpanel">
      {tab === 'tasks' && (groups.length ? groups.map((group) => <section className="vy-project-task-group" key={group.id}><h2>{group.label} <small>{group.tasks.length}</small></h2><ul>{group.tasks.map((task) => <li key={task.id}><button type="button" className={`vy-project-task-check ${task.status === 'done' ? 'is-done' : ''}`} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`} title={preview ? undefined : 'Shared project tasks are not connected yet'} disabled={!preview} onClick={() => toggleTask(task)}>{task.status === 'done' && <Check size={15} />}</button><div><strong>{task.title}</strong><span>{task.assignee ? personName(task.assignee) : 'Unassigned'}{task.due && ` · due ${displayDate(task.due)}`}{task.details && ` · ${task.details}`}</span></div>{preview && <button className="vy-button vy-button-small" type="button" onClick={() => setTaskEditor(task.id)}>Edit</button>}</li>)}</ul></section>) : <p className="vy-project-empty">No tasks in this project yet.</p>)}
      {tab === 'chat' && <div className="vy-project-chat"><h2>Project chat</h2>{messages.filter((message) => message.projectId === id).length ? <ul>{messages.filter((message) => message.projectId === id).map((message) => <li key={message.id}><strong>{personName(message.author)}</strong><time dateTime={message.at}>{new Date(message.at).toLocaleString()}</time><p>{message.text}</p></li>)}</ul> : <p className="vy-project-empty">No messages yet.</p>}{preview ? <form onSubmit={postMessage}><label htmlFor="vy-project-message">Add a message</label><textarea id="vy-project-message" name="message" rows={3} required maxLength={2000} /><button type="submit" className="vy-button vy-button-dark">Post message</button></form> : <p>Shared project chat is not connected yet.</p>}</div>}
      {tab === 'files' && <div className="vy-project-files"><h2>Files</h2><p className="vy-project-empty">Project file storage is not connected yet. Add an Asana link in project settings to keep related work together.</p></div>}
      {tab === 'details' && <dl className="vy-project-details"><div><dt>Department</dt><dd>{department.name}</dd></div><div><dt>Project manager</dt><dd>{project.manager ? personName(project.manager) : 'Not set'}</dd></div><div><dt>Start</dt><dd>{project.start ? displayDate(project.start) : 'Not set'}</dd></div><div><dt>Due</dt><dd>{project.due ? displayDate(project.due) : 'Not set'}</dd></div><div><dt>Members</dt><dd>{project.members.length ? project.members.map(personName).join(', ') : 'None yet'}</dd></div><div><dt>Asana</dt><dd>{asana ? <a href={asana} target="_blank" rel="noopener noreferrer">Open project <ArrowUpRight size={13} /></a> : 'Not linked'}</dd></div><div className="vy-project-details-notes"><dt>What this project is</dt><dd>{project.notes || 'Not set'}</dd></div></dl>}
    </section>
    {settingsOpen && <ProjectDialog project={project} departments={[companyDepartment, ...departments]} people={people} currentUser={currentUser} onSave={(next) => { onProjectsChange?.(projects.map((item) => item.id === next.id ? next : item)); setSettingsOpen(false) }} onDelete={deleteProject} onClose={() => setSettingsOpen(false)} />}
    {taskEditor && <ProjectTaskDialog key={taskEditor} task={selectedTask} kind="task" projectId={id} departments={[companyDepartment, ...departments]} projects={projects} people={people} onSave={saveTask} onClose={() => setTaskEditor(null)} />}
  </>
}
