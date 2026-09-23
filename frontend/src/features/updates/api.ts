import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'
import type { Access } from '@/features/auth'

export type HqUpdate = {
  id: string
  organization_id: string
  department_code: string
  body: string
  author_name: string
  created_by: string
  created_at: string
}

export async function loadUpdates(organizationId: string) {
  const { data, error } = await requireSupabase().from('hq_updates').select('*').eq('organization_id', organizationId)
    .order('created_at', { ascending: false }).limit(100)
  return dataOrThrow(data as HqUpdate[] | null, error)
}

export async function postUpdate(access: Access, departmentCode: string, body: string) {
  const { data, error } = await requireSupabase().from('hq_updates').insert({
    organization_id: access.organization.organization_id,
    department_code: departmentCode,
    body: body.trim(),
  }).select('*').single()
  return dataOrThrow(data as HqUpdate | null, error)
}
