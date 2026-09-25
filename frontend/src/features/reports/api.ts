import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'
import type { ReportPeriod } from './live-period'

export type TeamReport = {
  id: string
  organization_id: string
  department_code: string
  report_type: 'weekly' | 'monthly' | 'vendor_pricing'
  period_start: string
  period_end: string
  store_id: string | null
  template_version: number
  status: 'draft' | 'submitted'
  summary: string | null
  payload: Record<string, unknown>
  revision: number
  updated_at: string
}

export type ReportIdentity = { organizationId: string; departmentCode: string; period: ReportPeriod; storeId: string | null }

export type TeamReportSummary = Pick<TeamReport, 'id' | 'department_code' | 'report_type' | 'period_start' | 'period_end' | 'store_id' | 'status' | 'summary' | 'updated_at'> & { submitted_at: string | null }
export type HistoryFilters = {
  organizationId: string
  status: 'draft' | 'submitted' | null
  type: 'weekly' | 'monthly' | null
  departmentCode: string | null
  storeId: string | null
  search: string
}

export async function listTeamReportHistory(filters: HistoryFilters, offset: number, pageSize = 25): Promise<{ items: TeamReportSummary[]; hasMore: boolean }> {
  let query = requireSupabase().from('team_reports')
    .select('id,department_code,report_type,period_start,period_end,store_id,status,summary,updated_at,submitted_at')
    .eq('organization_id', filters.organizationId)
    .in('report_type', ['weekly', 'monthly'])
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.type) query = query.eq('report_type', filters.type)
  if (filters.departmentCode) query = query.eq('department_code', filters.departmentCode)
  if (filters.storeId) query = query.eq('store_id', filters.storeId)
  if (filters.search.trim()) query = query.ilike('summary', `%${filters.search.trim().slice(0, 120)}%`)
  const { data, error } = await query.order('updated_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + pageSize)
  const rows = dataOrThrow(data as TeamReportSummary[] | null, error)
  return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize }
}

export async function getTeamReport(identity: ReportIdentity): Promise<TeamReport | null> {
  const { data, error } = await requireSupabase().rpc('get_team_report_for_period', {
    p_organization_id: identity.organizationId,
    p_department_code: identity.departmentCode,
    p_report_type: identity.period.type,
    p_period_start: identity.period.start,
    p_period_end: identity.period.end,
    p_store_id: identity.storeId,
  })
  if (error) throw error
  return data as TeamReport | null
}

export async function saveTeamReport(identity: ReportIdentity, payload: Record<string, unknown>, revision: number, summary: string): Promise<TeamReport> {
  const { data, error } = await requireSupabase().rpc('save_team_report_draft', {
    p_organization_id: identity.organizationId,
    p_department_code: identity.departmentCode,
    p_report_type: identity.period.type,
    p_period_start: identity.period.start,
    p_period_end: identity.period.end,
    p_store_id: identity.storeId,
    p_template_version: 1,
    p_payload: payload,
    p_expected_revision: revision,
    p_summary: summary.slice(0, 500),
  })
  return dataOrThrow(data as TeamReport | null, error)
}

export async function changeTeamReportStatus(organizationId: string, report: TeamReport, action: 'submit' | 'reopen'): Promise<TeamReport> {
  const { data, error } = await requireSupabase().rpc(action === 'submit' ? 'submit_team_report' : 'reopen_team_report', {
    p_organization_id: organizationId,
    p_report_id: report.id,
    p_expected_revision: report.revision,
  })
  return dataOrThrow(data as TeamReport | null, error)
}
