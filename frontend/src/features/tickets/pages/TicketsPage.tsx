import type { Access } from '@/features/auth'
import { NewTicket } from '../components/NewTicket'
import { TicketDetails } from '../components/TicketDetails'
import { TicketQueue } from '../components/TicketQueue'
import './tickets.css'

export default function TicketsPage({ access, ticketId }: { access: Access; ticketId?: string }) {
  if (ticketId === 'new') return <NewTicket access={access} />
  if (ticketId) return <TicketDetails access={access} ticketId={ticketId} />
  return <TicketQueue access={access} />
}
