import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'
import type { TicketCategory, TicketDraft, TicketPriority, TicketStatus } from './model'

export type TicketSummary = {
  ticket_id: string
  store_id: string
  department_code: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  title: string
  assignee_id: string | null
  reported_by: string
  revision: number
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export type Ticket = Omit<TicketSummary, 'ticket_id'> & {
  id: string
  organization_id: string
  description: string | null
}

export type TicketEvent = {
  event_id: number
  actor_id: string | null
  event_type: 'created' | 'status_changed' | 'assigned'
  from_value: string | null
  to_value: string | null
  body: string | null
  created_at: string
}

export type TicketAssignee = { user_id: string; display_name: string }

export async function listTickets(organizationId: string, filters: { storeId?: string; departmentCode?: string; status?: TicketStatus }): Promise<TicketSummary[]> {
  const { data, error } = await requireSupabase().rpc('list_tickets', {
    p_organization_id: organizationId,
    p_store_id: filters.storeId || null,
    p_department_code: filters.departmentCode || null,
    p_status: filters.status || null,
    p_assignee_id: null,
    p_limit: 200,
  })
  return dataOrThrow(data as TicketSummary[] | null, error)
}

export async function getTicket(organizationId: string, ticketId: string): Promise<Ticket | null> {
  const { data, error } = await requireSupabase().rpc('get_ticket', { p_organization_id: organizationId, p_ticket_id: ticketId })
  if (error) throw error
  return data as Ticket | null
}

export async function createTicket(organizationId: string, draft: TicketDraft): Promise<Ticket> {
  const { data, error } = await requireSupabase().rpc('create_ticket', {
    p_organization_id: organizationId,
    p_store_id: draft.storeId,
    p_department_code: draft.departmentCode,
    p_category: draft.category,
    p_priority: draft.priority,
    p_title: draft.title.trim(),
    p_description: draft.description.trim() || null,
  })
  return dataOrThrow(data as Ticket | null, error)
}

export async function updateTicketStatus(organizationId: string, ticket: Ticket, status: TicketStatus, note: string): Promise<Ticket> {
  const { data, error } = await requireSupabase().rpc('update_ticket_status', {
    p_organization_id: organizationId,
    p_ticket_id: ticket.id,
    p_expected_revision: ticket.revision,
    p_new_status: status,
    p_note: note.trim() || null,
  })
  return dataOrThrow(data as Ticket | null, error)
}

export async function assignTicket(organizationId: string, ticket: Ticket, assigneeId: string | null): Promise<Ticket> {
  const { data, error } = await requireSupabase().rpc('assign_ticket', {
    p_organization_id: organizationId,
    p_ticket_id: ticket.id,
    p_expected_revision: ticket.revision,
    p_assignee_id: assigneeId,
  })
  return dataOrThrow(data as Ticket | null, error)
}

export async function listTicketEvents(organizationId: string, ticketId: string): Promise<TicketEvent[]> {
  const { data, error } = await requireSupabase().rpc('list_ticket_events', { p_organization_id: organizationId, p_ticket_id: ticketId })
  return dataOrThrow(data as TicketEvent[] | null, error)
}

export async function listTicketAssignees(organizationId: string, departmentCode: string): Promise<TicketAssignee[]> {
  const { data, error } = await requireSupabase().rpc('list_hq_department_people', {
    p_organization_id: organizationId,
    p_department_code: departmentCode,
  })
  return dataOrThrow(data as TicketAssignee[] | null, error)
}
