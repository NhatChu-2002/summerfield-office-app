export type ProjectStatus = 'track' | 'risk' | 'blocked' | 'done'
export type ProjectPriority = 'urgent' | 'high' | 'normal' | 'future'

export type ProjectRecord = {
  id: string
  name: string
  department: string
  manager: string
  members: string[]
  start: string
  due: string
  status: ProjectStatus
  asanaUrl: string
  notes: string
}

export type ProjectTask = {
  id: string
  projectId: string
  department: string
  title: string
  details: string
  due: string
  priority: ProjectPriority
  status: 'open' | 'done'
  assignee: string
  kind: 'task' | 'ticket'
}

export type ProjectMessage = { id: string; projectId: string; author: string; text: string; at: string }
export type ProjectPerson = { id: string; name: string }

export const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: 'track', label: 'On track' }, { value: 'risk', label: 'At risk' },
  { value: 'blocked', label: 'Blocked' }, { value: 'done', label: 'Done' },
]

export const projectPriorities: { value: ProjectPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' }, { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' }, { value: 'future', label: 'Future' },
]

export function filterProjects(projects: ProjectRecord[], filters: { query: string; department: string; status: string; mineId?: string }) {
  const query = filters.query.trim().toLocaleLowerCase()
  return projects.filter((project) => (!filters.department || project.department === filters.department)
    && (!filters.status || project.status === filters.status)
    && (!filters.mineId || project.manager === filters.mineId || project.members.includes(filters.mineId))
    && (!query || `${project.name} ${project.notes}`.toLocaleLowerCase().includes(query)))
}

export function projectProgress(projectId: string, tasks: ProjectTask[], today: string) {
  const related = tasks.filter((task) => task.projectId === projectId)
  const done = related.filter((task) => task.status === 'done').length
  const overdue = related.filter((task) => task.status === 'open' && !!task.due && task.due < today).length
  return { total: related.length, done, overdue, percent: related.length ? Math.round(done / related.length * 100) : 0 }
}

export function projectSummary(projects: ProjectRecord[], tasks: ProjectTask[], userId: string, today: string) {
  return {
    running: projects.filter((project) => project.status !== 'done').length,
    overdue: tasks.filter((task) => task.status === 'open' && !!task.due && task.due < today).length,
    tickets: tasks.filter((task) => task.kind === 'ticket' && task.status === 'open' && !task.assignee).length,
    mine: tasks.filter((task) => task.status === 'open' && task.assignee === userId).length,
  }
}

export function projectTaskGroups(tasks: ProjectTask[]) {
  const groups: { id: ProjectPriority | 'done'; label: string; tasks: ProjectTask[] }[] = [
    { id: 'urgent', label: 'Urgent', tasks: [] }, { id: 'high', label: 'High', tasks: [] },
    { id: 'normal', label: 'Normal', tasks: [] }, { id: 'future', label: 'Future', tasks: [] },
    { id: 'done', label: 'Verified & completed', tasks: [] },
  ]
  for (const task of tasks) groups.find((group) => group.id === (task.status === 'done' ? 'done' : task.priority))?.tasks.push(task)
  return groups.filter((group) => group.tasks.length)
}

export function safeProjectUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch { return null }
}
