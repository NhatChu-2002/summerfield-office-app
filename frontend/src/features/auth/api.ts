import type { Session } from '@supabase/supabase-js'
import { DEPARTMENTS, type Department } from '@/shared/config/departments'
import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'

export type StoreAccess = { id: string; code: string; name: string; timezone: string; toast_guid_secret_name: string | null }

export type Organization = {
  organization_id: string
  organization_name: string
  organization_slug: string
  role: 'admin' | 'manager' | 'viewer'
  stores: StoreAccess[]
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

type AccessResponse = {
  user_id: string
  display_name: string | null
  memberships: (Omit<Organization, 'stores'> & { stores?: StoreAccess[] | null })[] | null
}

export async function loadAccess(session: Session, preferredOrganizationId?: string): Promise<Access> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_my_access_context')
  const context = dataOrThrow(data as AccessResponse | null, error)
  const organizations = (context.memberships || []).map((item) => ({ ...item, stores: item.stores || [] }))
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
