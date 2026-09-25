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
