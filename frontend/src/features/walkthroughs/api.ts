import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'

export type WalkthroughStore = { store_id: string; code: string; name: string; can_edit: boolean }
export type WalkthroughSummary = {
  inspection_id: string
  store_id: string
  visit_date: string
  template_version: number
  status: 'draft' | 'submitted'
  score: number | null
  grade: string | null
  summary: string | null
  revision: number
  updated_by: string | null
  updated_at: string
  submitted_at: string | null
  photo_count: number
}
export type WalkthroughRecord = Omit<WalkthroughSummary, 'inspection_id' | 'photo_count'> & {
  id: string
  organization_id: string
  payload: Record<string, unknown>
}
export type WalkthroughCursor = { visitDate: string; updatedAt: string; id: string }

export async function listWalkthroughStores(organizationId: string): Promise<WalkthroughStore[]> {
  const { data, error } = await requireSupabase().rpc('list_store_inspection_stores', { p_organization_id: organizationId })
  return dataOrThrow(data as WalkthroughStore[] | null, error)
}

export async function listWalkthroughPage(organizationId: string, filters: { storeId?: string; status?: 'draft' | 'submitted' }, cursor: WalkthroughCursor | null, pageSize = 30): Promise<{ items: WalkthroughSummary[]; nextCursor: WalkthroughCursor | null }> {
  const { data, error } = await requireSupabase().rpc('list_store_inspection_page', {
    p_organization_id: organizationId,
    p_store_id: filters.storeId || null,
    p_status: filters.status || null,
    p_cursor_visit_date: cursor?.visitDate ?? null,
    p_cursor_updated_at: cursor?.updatedAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: pageSize + 1,
  })
  const rows = dataOrThrow(data as WalkthroughSummary[] | null, error)
  const items = rows.slice(0, pageSize)
  const last = items.at(-1)
  return { items, nextCursor: rows.length > pageSize && last ? {
    visitDate: last.visit_date, updatedAt: last.updated_at, id: last.inspection_id,
  } : null }
}

export async function getWalkthrough(organizationId: string, storeId: string, visitDate: string): Promise<WalkthroughRecord | null> {
  const { data, error } = await requireSupabase().rpc('get_store_inspection_for_date', {
    p_organization_id: organizationId, p_store_id: storeId, p_visit_date: visitDate,
  })
  if (error) throw error
  return data as WalkthroughRecord | null
}

export async function saveWalkthroughDraft(organizationId: string, storeId: string, visitDate: string, payload: Record<string, unknown>, record: WalkthroughRecord | null, summary: string, score: number | null, grade: string | null): Promise<WalkthroughRecord> {
  const { data, error } = await requireSupabase().rpc('save_store_inspection_draft', {
    p_organization_id: organizationId,
    p_store_id: storeId,
    p_visit_date: visitDate,
    p_template_version: 1,
    p_payload: payload,
    p_expected_revision: record?.revision ?? 0,
    p_score: score,
    p_grade: grade,
    p_summary: summary,
  })
  return dataOrThrow(data as WalkthroughRecord | null, error)
}

export async function submitWalkthrough(organizationId: string, record: WalkthroughRecord): Promise<WalkthroughRecord> {
  const { data, error } = await requireSupabase().rpc('submit_store_inspection', {
    p_organization_id: organizationId, p_inspection_id: record.id, p_expected_revision: record.revision,
  })
  return dataOrThrow(data as WalkthroughRecord | null, error)
}

export async function reopenWalkthrough(organizationId: string, record: WalkthroughRecord): Promise<WalkthroughRecord> {
  const { data, error } = await requireSupabase().rpc('reopen_store_inspection', {
    p_organization_id: organizationId, p_inspection_id: record.id, p_expected_revision: record.revision,
  })
  return dataOrThrow(data as WalkthroughRecord | null, error)
}
