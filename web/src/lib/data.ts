import type { Session } from '@supabase/supabase-js'
import { DEPARTMENTS, type Department } from '../departments'
import { requireSupabase } from './supabase'

export type Organization = {
  organization_id: string
  organization_name: string
  organization_slug: string
  role: 'admin' | 'manager' | 'viewer'
}

export type DepartmentRole = 'viewer' | 'member' | 'lead'
export type Assignment = { department_code: string; team_role: DepartmentRole }

export type Access = {
  userId: string
  displayName: string
  email: string
  organization: Organization
  organizations: Organization[]
  assignments: Assignment[]
  departments: Department[]
}

export type HqTask = {
  id: string
  organization_id: string
  department_code: string
  title: string
  details: string
  due_date: string | null
  status: 'open' | 'done'
  assigned_to: string | null
  created_by: string
  revision: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type HqUpdate = {
  id: string
  organization_id: string
  department_code: string
  body: string
  author_name: string
  created_by: string
  created_at: string
}

export type Person = { user_id: string; display_name: string }

type AccessResponse = {
  user_id: string
  display_name: string | null
  memberships: Organization[] | null
}

function dataOrThrow<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  if (data === null) throw new Error('The server returned no data.')
  return data
}

export async function loadAccess(session: Session, preferredOrganizationId?: string): Promise<Access> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_my_access_context')
  const context = dataOrThrow(data as AccessResponse | null, error)
  const organizations = context.memberships || []
  if (!organizations.length) throw new Error('This account has no active Summerfield organization membership.')
  const organization = organizations.find((item) => item.organization_id === preferredOrganizationId) || organizations[0]
  const membership = await client.rpc('get_my_team_report_departments', {
    p_organization_id: organization.organization_id,
  })
  const assignments = dataOrThrow(membership.data as Assignment[] | null, membership.error)
  const departments = organization.role === 'admin'
    ? DEPARTMENTS
    : DEPARTMENTS.filter((department) => assignments.some(
        (item) => item.department_code === department.code,
      ))

  return {
    userId: context.user_id || session.user.id,
    displayName: context.display_name?.trim() || session.user.email?.split('@')[0] || 'Teammate',
    email: session.user.email || '',
    organization,
    organizations,
    assignments,
    departments,
  }
}

export function departmentRole(access: Access, code: string): DepartmentRole | null {
  if (access.organization.role === 'admin') return 'lead'
  return access.assignments.find((assignment) => assignment.department_code === code)?.team_role || null
}

export function canWriteDepartment(access: Access, code: string) {
  return ['member', 'lead'].includes(departmentRole(access, code) || '')
}

export function canChangeTask(access: Access, task: HqTask) {
  return departmentRole(access, task.department_code) === 'lead'
    || task.created_by === access.userId
    || task.assigned_to === access.userId
}

export async function loadHqData(organizationId: string) {
  const client = requireSupabase()
  const [taskResult, updateResult] = await Promise.all([
    client.from('hq_tasks').select('*').eq('organization_id', organizationId)
      .order('created_at', { ascending: false }).limit(300),
    client.from('hq_updates').select('*').eq('organization_id', organizationId)
      .order('created_at', { ascending: false }).limit(100),
  ])
  return {
    tasks: dataOrThrow(taskResult.data as HqTask[] | null, taskResult.error),
    updates: dataOrThrow(updateResult.data as HqUpdate[] | null, updateResult.error),
  }
}

export async function listDepartmentPeople(organizationId: string, departmentCode: string) {
  const { data, error } = await requireSupabase().rpc('list_hq_department_people', {
    p_organization_id: organizationId,
    p_department_code: departmentCode,
  })
  return dataOrThrow(data as Person[] | null, error)
}

export async function createTask(input: {
  access: Access
  departmentCode: string
  title: string
  details: string
  dueDate: string | null
  assignedTo: string | null
}) {
  const { data, error } = await requireSupabase().from('hq_tasks').insert({
    organization_id: input.access.organization.organization_id,
    department_code: input.departmentCode,
    title: input.title.trim(),
    details: input.details.trim(),
    due_date: input.dueDate,
    assigned_to: input.assignedTo,
    created_by: input.access.userId,
  }).select('*').single()
  return dataOrThrow(data as HqTask | null, error)
}

export async function setTaskStatus(access: Access, task: HqTask, status: 'open' | 'done') {
  const { data, error } = await requireSupabase().rpc('set_hq_task_status', {
    p_organization_id: access.organization.organization_id,
    p_task_id: task.id,
    p_expected_revision: task.revision,
    p_status: status,
  })
  return dataOrThrow(data as HqTask | null, error)
}

export async function postUpdate(access: Access, departmentCode: string, body: string) {
  const { data, error } = await requireSupabase().from('hq_updates').insert({
    organization_id: access.organization.organization_id,
    department_code: departmentCode,
    body: body.trim(),
  }).select('*').single()
  return dataOrThrow(data as HqUpdate | null, error)
}
