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
  sort_priority: number
}

export type Ticket = Omit<TicketSummary, 'ticket_id' | 'sort_priority'> & {
  id: string
  organization_id: string
  description: string | null
}

export type TicketEvent = {
  event_id: number
  actor_id: string | null
  event_type: 'created' | 'status_changed' | 'assigned' | 'routed'
  from_value: string | null
  to_value: string | null
  body: string | null
  created_at: string
}

export type TicketAssignee = { user_id: string; display_name: string }
export type TicketStore = { store_id: string; code: string; name: string }
export type TicketCursor = { sortPriority: number; createdAt: string; ticketId: string }

export async function listTicketStores(organizationId: string): Promise<TicketStore[]> {
  const { data, error } = await requireSupabase().rpc('list_ticket_stores', { p_organization_id: organizationId })
  return dataOrThrow(data as TicketStore[] | null, error)
}

export async function listTicketPage(organizationId: string, filters: { storeId?: string; departmentCode?: string; status?: TicketStatus }, cursor: TicketCursor | null, pageSize = 50): Promise<{ items: TicketSummary[]; nextCursor: TicketCursor | null }> {
  const { data, error } = await requireSupabase().rpc('list_ticket_page', {
    p_organization_id: organizationId,
    p_store_id: filters.storeId || null,
    p_department_code: filters.departmentCode || null,
    p_status: filters.status || null,
    p_cursor_priority: cursor?.sortPriority ?? null,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.ticketId ?? null,
    p_limit: pageSize + 1,
  })
  const rows = dataOrThrow(data as TicketSummary[] | null, error)
  const items = rows.slice(0, pageSize)
  const last = items.at(-1)
  return { items, nextCursor: rows.length > pageSize && last
    ? { sortPriority: last.sort_priority, createdAt: last.created_at, ticketId: last.ticket_id } : null }
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

export async function createTicketWithAssignment(organizationId: string, draft: TicketDraft, assigneeId: string): Promise<Ticket> {
  const { data, error } = await requireSupabase().rpc('create_ticket_with_assignment', {
    p_organization_id: organizationId,
    p_store_id: draft.storeId,
    p_department_code: draft.departmentCode,
    p_category: draft.category,
    p_priority: draft.priority,
    p_title: draft.title.trim(),
    p_assignee_id: assigneeId,
    p_description: draft.description.trim() || null,
  })
  return dataOrThrow(data as Ticket | null, error)
}

export async function rerouteTicket(organizationId: string, ticket: Ticket, departmentCode: string): Promise<Ticket> {
  const { data, error } = await requireSupabase().rpc('reroute_ticket', {
    p_organization_id: organizationId,
    p_ticket_id: ticket.id,
    p_expected_revision: ticket.revision,
    p_department_code: departmentCode,
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
