import { departmentRole, type Access } from '@/features/auth'
import type { HqTask } from './api'

// Shapes the UI only; the set_hq_task_status function enforces the same rule in the database.
export function canChangeTask(access: Access, task: HqTask) {
  return departmentRole(access, task.department_code) === 'lead'
    || task.created_by === access.userId
    || task.assigned_to === access.userId
}
