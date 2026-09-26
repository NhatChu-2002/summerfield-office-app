import type { Access } from '@/features/auth'

export const ticketCategories = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'supply', label: 'Supplies' },
  { value: 'facility', label: 'Facility' },
  { value: 'pos', label: 'POS' },
  { value: 'staffing', label: 'Staffing' },
] as const

export const ticketPriorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const ticketStatuses = [
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const

export type TicketCategory = typeof ticketCategories[number]['value']
export type TicketPriority = typeof ticketPriorities[number]['value']
export type TicketStatus = typeof ticketStatuses[number]['value']

const nextStatuses: Record<TicketStatus, TicketStatus[]> = {
  open: ['acknowledged', 'in_progress'],
  acknowledged: ['in_progress', 'open'],
  in_progress: ['blocked', 'resolved', 'acknowledged'],
  blocked: ['in_progress'],
  resolved: ['closed', 'in_progress'],
  closed: ['open'],
}

export function statusLabel(status: TicketStatus): string {
  return ticketStatuses.find((item) => item.value === status)?.label || status
}

export function nextTicketStatuses(status: TicketStatus): TicketStatus[] { return nextStatuses[status] }

export function canSubmitTicket(access: Access): boolean {
  return access.organization.role === 'admin'
    || (access.organization.role === 'manager' && access.organization.stores.length > 0)
    || access.assignments.some((item) => item.team_role === 'lead')
}

export function canRouteTicket(access: Access): boolean {
  return access.organization.role === 'admin'
    || access.assignments.some((item) => item.team_role === 'lead')
}

export function canReviewTicket(access: Access, departmentCode: string): boolean {
  return access.organization.role === 'admin' || access.assignments.some((item) => item.department_code === departmentCode && item.team_role === 'lead')
}

export type TicketDraft = {
  storeId: string
  departmentCode: string
  category: TicketCategory
  priority: TicketPriority
  title: string
  description: string
}

export function validateTicketDraft(draft: TicketDraft, storeIds: string[], departmentCodes: string[]): string | null {
  if (!storeIds.includes(draft.storeId)) return 'Choose an available store.'
  if (!departmentCodes.includes(draft.departmentCode)) return 'Choose a department.'
  if (!ticketCategories.some((item) => item.value === draft.category)) return 'Choose a ticket category.'
  if (!ticketPriorities.some((item) => item.value === draft.priority)) return 'Choose a priority.'
  if (!draft.title.trim()) return 'Enter a ticket title.'
  if (draft.title.trim().length > 140) return 'Keep the title within 140 characters.'
  if (draft.description.trim().length > 4000) return 'Keep the description within 4,000 characters.'
  return null
}

export function ticketServiceMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Ticket service is unavailable.'
  if (/Could not find the function public\.|schema cache|relation ["']public\.tickets["'] does not exist/i.test(message)) {
    return 'Ticket service setup is not complete in this environment. Ask an administrator to apply the ticket migration.'
  }
  return message
}
