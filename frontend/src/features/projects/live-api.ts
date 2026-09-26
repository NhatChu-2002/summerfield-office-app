import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'
import type { LiveProject, ProjectDraft } from './live-model'

export type ProjectPerson = { user_id: string; display_name: string }

export async function listLiveProjects(organizationId: string): Promise<LiveProject[]> {
  const { data, error } = await requireSupabase().from('hq_projects').select('*')
    .eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(200)
  return dataOrThrow(data as LiveProject[] | null, error)
}

export async function getLiveProject(organizationId: string, projectId: string): Promise<LiveProject | null> {
  const { data, error } = await requireSupabase().from('hq_projects').select('*')
    .eq('organization_id', organizationId).eq('id', projectId).maybeSingle()
  if (error) throw error
  return data as LiveProject | null
}

export async function listProjectOwners(organizationId: string, departmentCode: string): Promise<ProjectPerson[]> {
  const { data, error } = await requireSupabase().rpc('list_hq_project_owners', {
    p_organization_id: organizationId, p_department_code: departmentCode,
  })
  return dataOrThrow(data as ProjectPerson[] | null, error)
}

export async function createLiveProject(organizationId: string, draft: ProjectDraft): Promise<LiveProject> {
  const { data, error } = await requireSupabase().rpc('create_hq_project', {
    p_organization_id: organizationId,
    p_department_code: draft.departmentCode,
    p_name: draft.name.trim(),
    p_description: draft.description.trim(),
    p_owner_id: draft.ownerId,
    p_start_date: draft.startDate,
    p_due_date: draft.dueDate,
    p_asana_url: draft.asanaUrl?.trim() || null,
  })
  return dataOrThrow(data as LiveProject | null, error)
}

export async function updateLiveProject(organizationId: string, project: LiveProject, draft: ProjectDraft): Promise<LiveProject> {
  const { data, error } = await requireSupabase().rpc('update_hq_project', {
    p_organization_id: organizationId,
    p_project_id: project.id,
    p_expected_revision: project.revision,
    p_name: draft.name.trim(),
    p_description: draft.description.trim(),
    p_status: draft.status,
    p_owner_id: draft.ownerId,
    p_start_date: draft.startDate,
    p_due_date: draft.dueDate,
    p_asana_url: draft.asanaUrl?.trim() || null,
  })
  return dataOrThrow(data as LiveProject | null, error)
}

export async function setLiveProjectArchived(organizationId: string, project: LiveProject, archived: boolean): Promise<LiveProject> {
  const { data, error } = await requireSupabase().rpc('set_hq_project_archived', {
    p_organization_id: organizationId,
    p_project_id: project.id,
    p_expected_revision: project.revision,
    p_archived: archived,
  })
  return dataOrThrow(data as LiveProject | null, error)
}
