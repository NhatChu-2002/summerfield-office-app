import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'
import type { Access } from '@/features/auth'

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

export type Person = { user_id: string; display_name: string }

export async function loadTasks(organizationId: string) {
  const { data, error } = await requireSupabase().from('hq_tasks').select('*').eq('organization_id', organizationId)
    .order('created_at', { ascending: false }).limit(300)
  return dataOrThrow(data as HqTask[] | null, error)
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
