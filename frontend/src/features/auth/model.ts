import type { Access, DepartmentRole } from './api'

// These checks only shape the UI. Row-level security in the database is what enforces access.
export function departmentRole(access: Access, code: string): DepartmentRole | null {
  if (access.organization.role === 'admin') return 'lead'
  return access.assignments.find((assignment) => assignment.department_code === code)?.team_role || null
}

export function canWriteDepartment(access: Access, code: string) {
  return ['member', 'lead'].includes(departmentRole(access, code) || '')
}
