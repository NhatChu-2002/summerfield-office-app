import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import type { Access } from '@/features/auth'
import { DEPARTMENTS, departmentByCode } from '@/shared/config/departments'
import { SelectField } from '@/shared/ui/SelectField'
import { listTickets, type TicketSummary } from '../api'
import { canSubmitTicket, statusLabel, ticketCategories, ticketServiceMessage, ticketStatuses, type TicketStatus } from '../model'

const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' })

export function TicketQueue({ access }: { access: Access }) {
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [storeId, setStoreId] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [rows, setRows] = useState<TicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const organizationId = access.organization.organization_id

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listTickets(organizationId, { status: status || undefined, storeId: storeId || undefined, departmentCode: departmentCode || undefined })
      .then((result) => { if (active) setRows(result) })
      .catch((cause: unknown) => { if (active) { setRows([]); setError(ticketServiceMessage(cause)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organizationId, status, storeId, departmentCode, refresh])

  return <div className="vy-tickets">
    <a className="vy-ticket-back" href="#/projects"><ArrowLeft size={16} /> Projects</a>
    <header className="vy-ticket-head"><div><h1>Ticket desk</h1><p>Store issues reported to your teams.</p></div>{canSubmitTicket(access) && <a className="vy-button vy-button-dark" href="#/tickets/new"><Plus size={16} /> Submit ticket</a>}</header>
    <div className="vy-ticket-filters">
      <SelectField ariaLabel="Ticket status" value={status} onChange={(value) => setStatus(value as TicketStatus | '')} options={[{ value: '', label: 'All statuses' }, ...ticketStatuses]} size="compact" />
      <SelectField ariaLabel="Ticket department" value={departmentCode} onChange={setDepartmentCode} options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((item) => ({ value: item.code, label: item.name }))]} size="compact" />
      {access.organization.stores.length > 1 && <SelectField ariaLabel="Ticket store" value={storeId} onChange={setStoreId} options={[{ value: '', label: 'All stores' }, ...access.organization.stores.map((item) => ({ value: item.id, label: item.name }))]} size="compact" />}
      <button className="vy-ticket-refresh" type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} title="Refresh tickets" aria-label="Refresh tickets"><RefreshCw size={17} /></button>
    </div>
    {error && <p className="vy-ticket-error" role="alert">{error}</p>}
    {loading ? <p className="vy-ticket-message" role="status">Loading tickets...</p> : !error && (rows.length ? <>
      <div className="vy-ticket-list-head" aria-hidden="true"><span>Ticket</span><span>Team / store</span><span>Status</span><span>Updated</span></div>
      <ul className="vy-ticket-queue">{rows.map((ticket) => {
        const store = access.organization.stores.find((item) => item.id === ticket.store_id)
        const team = departmentByCode(ticket.department_code)?.name || ticket.department_code
        return <li key={ticket.ticket_id}><a className="vy-list-row-link" href={`#/tickets/${ticket.ticket_id}`} aria-label={`Open ${ticket.title} ticket`}>
          <span className="vy-ticket-row-title"><strong>{ticket.title}</strong><small>{ticket.priority === 'urgent' ? 'Urgent' : ticket.priority === 'high' ? 'High priority' : ticketCategories.find((item) => item.value === ticket.category)?.label || ticket.category}</small></span>
          <span className="vy-ticket-row-meta">{team}<small>{store?.name || `Store ${ticket.store_id.slice(0, 8)}`}</small></span>
          <span className={`vy-ticket-status is-${ticket.status}`}>{statusLabel(ticket.status)}</span>
          <time dateTime={ticket.updated_at}>{dateLabel(ticket.updated_at)}</time>
        </a></li>
      })}</ul>
      {rows.length === 200 && <p className="vy-ticket-message">Showing the first 200 tickets. Narrow the filters to see another part of the queue.</p>}
    </> : <div className="vy-ticket-empty"><h2>No tickets found</h2><p>{status || storeId || departmentCode ? 'No visible tickets match these filters.' : 'Tickets you reported or can review will appear here.'}</p></div>)}
  </div>
}
