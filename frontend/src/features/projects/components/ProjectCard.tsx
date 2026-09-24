import { ArrowUpRight } from 'lucide-react'
import { departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { projectHref } from '@/shared/lib/routing'
import { projectProgress, projectStatuses, safeProjectUrl, type ProjectPerson, type ProjectRecord, type ProjectTask } from '../model'

export function ProjectCard({ project, tasks, people, department, today }: {
  project: ProjectRecord
  tasks: ProjectTask[]
  people: ProjectPerson[]
  department: ReferenceDepartment
  today: string
}) {
  const progress = projectProgress(project.id, tasks, today)
  const asana = safeProjectUrl(project.asanaUrl)
  return <article className="vy-project-card" style={departmentStyle(department.color)}>
    <div className="vy-project-card-head"><h2>{project.name}</h2><span className={`vy-project-status is-${project.status}`}>{projectStatuses.find((item) => item.value === project.status)?.label || 'On track'}</span></div>
    <p className="vy-project-card-meta"><span className="vy-project-department" style={departmentStyle(department.color)}>{department.name}</span> · {project.manager ? `led by ${people.find((person) => person.id === project.manager)?.name || 'Unknown'}` : 'no manager yet'}{project.due && ` · due ${displayDate(project.due)}`}</p>
    <div className="vy-project-progress" role="img" aria-label={`${progress.percent}% of tasks done`}><span style={{ width: `${progress.percent}%` }} /></div>
    <p className="vy-project-card-meta">{progress.done} of {progress.total} tasks done{progress.overdue > 0 && <strong className="vy-project-overdue"> · {progress.overdue} overdue</strong>}</p>
    <div className="vy-project-card-actions"><a className="vy-button vy-button-dark vy-button-small" href={projectHref(project.id)}>Open project</a>{asana && <a className="vy-button vy-button-small" href={asana} target="_blank" rel="noopener noreferrer">In Asana <ArrowUpRight size={13} /></a>}</div>
  </article>
}
