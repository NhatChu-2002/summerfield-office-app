import { departmentRole, type Access } from '@/features/auth'
import type { HqTask } from './api'

export type TaskScope = 'mine' | 'all'
export type TaskStatusFilter = 'open' | 'done' | 'all'

export function canChangeTask(access: Access, task: HqTask) {
  return departmentRole(access, task.department_code) === 'lead'
    || task.created_by === access.userId
    || task.assigned_to === access.userId
}

// Open before done, then by due date, then newest first.
export function compareTasks(a: HqTask, b: HqTask) {
  if (a.status !== b.status) return a.status === 'open' ? -1 : 1
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
  if (a.due_date) return -1
  if (b.due_date) return 1
  return b.created_at.localeCompare(a.created_at)
}
