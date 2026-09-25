import type { Access } from '@/features/auth'

export type ReportCapabilities = { read: boolean; edit: boolean; submit: boolean; reopen: boolean }

// Mirrors the existing team_reports RPC checks for UI affordances; the database remains authoritative.
export function reportCapabilities(access: Access, departmentCode: string, storeId: string | null): ReportCapabilities {
  const unavailable = { read: false, edit: false, submit: false, reopen: false }
  const isStoreReport = departmentCode === 'store_manager'
  if (!access.departments.some((department) => department.code === departmentCode)
    || isStoreReport !== (storeId !== null)) return unavailable

  const organizationRole = access.organization.role
  const departmentRole = access.assignments.find((assignment) => assignment.department_code === departmentCode)?.team_role
  const storeAccessible = storeId === null || access.organization.stores.some((store) => store.id === storeId)
  const read = storeAccessible && (organizationRole === 'admin' || departmentRole === 'viewer' || departmentRole === 'member' || departmentRole === 'lead')
  const edit = read && (organizationRole === 'admin' || departmentRole === 'member' || departmentRole === 'lead')
  const submit = read && (organizationRole === 'admin' || departmentRole === 'lead')
    && (storeId === null || organizationRole === 'admin' || organizationRole === 'manager')
  const reopen = read && organizationRole === 'admin'
  return { read, edit, submit, reopen }
}
