import { departmentRole, type Access } from '@/features/auth'
import type { HqTask } from './api'
import { canChangeTaskForRole } from './model'

// Shapes the UI only; set_hq_task_status is the authorization boundary.
export function canChangeTask(access: Access, task: HqTask) {
  return canChangeTaskForRole(departmentRole(access, task.department_code), task, access.userId)
}
