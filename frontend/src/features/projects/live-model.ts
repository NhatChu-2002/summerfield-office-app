import type { Access } from '@/features/auth'
import { canWriteDepartment, departmentRole } from '../auth/model.ts'
import { safeProjectUrl, type ProjectStatus } from './model.ts'

export type LiveProject = {
  id: string
  organization_id: string
  department_code: string
  name: string
  description: string
  status: ProjectStatus
  owner_id: string | null
  start_date: string | null
  due_date: string | null
  asana_url: string | null
  revision: number
  archived_at: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export type ProjectDraft = {
  departmentCode: string
  name: string
  description: string
  status: ProjectStatus
  ownerId: string | null
  startDate: string | null
  dueDate: string | null
  asanaUrl: string | null
}

export function canEditLiveProject(access: Access, project: LiveProject) {
  return canWriteDepartment(access, project.department_code)
    && (departmentRole(access, project.department_code) === 'lead'
      || project.created_by === access.userId || project.owner_id === access.userId)
}

export function canArchiveLiveProject(access: Access, project: LiveProject) {
  return departmentRole(access, project.department_code) === 'lead'
}

export function filterLiveProjects(projects: LiveProject[], filters: {
  query: string; departmentCode: string; status: string; archived: boolean
}) {
  const query = filters.query.trim().toLocaleLowerCase()
  return projects.filter((project) => (!!project.archived_at === filters.archived)
    && (!filters.departmentCode || project.department_code === filters.departmentCode)
    && (!filters.status || project.status === filters.status)
    && (!query || `${project.name} ${project.description}`.toLocaleLowerCase().includes(query)))
}

export function validateProjectDraft(draft: ProjectDraft): string | null {
  if (!draft.name.trim() || draft.name.trim().length > 120) return 'Enter a project name up to 120 characters.'
  if (draft.description.length > 2000) return 'Keep the description under 2,000 characters.'
  if (draft.startDate && draft.dueDate && draft.dueDate < draft.startDate) return 'Due date must be on or after the start date.'
  if (draft.asanaUrl && !safeProjectUrl(draft.asanaUrl)) return 'Enter an http or https project link.'
  return null
}

export function projectServiceMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Project service is unavailable.'
  if (/Could not find the function public\.|schema cache|relation ["']public\.hq_projects["'] does not exist/i.test(message)) {
    return 'Project service setup is not complete in this environment. Ask an administrator to apply the HQ projects migration.'
  }
  return message
}
