import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import type { Access } from '@/features/auth'
import { DEPARTMENTS, departmentByCode } from '@/shared/config/departments'
import { SelectField } from '@/shared/ui/SelectField'
import { listTicketPage, listTicketStores, type TicketCursor, type TicketStore, type TicketSummary } from '../api'
import { canRouteTicket, canSubmitTicket, statusLabel, ticketCategories, ticketServiceMessage, ticketStatuses, type TicketStatus } from '../model'

const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' })

export function TicketQueue({ access }: { access: Access }) {
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [storeId, setStoreId] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [rows, setRows] = useState<TicketSummary[]>([])
  const [stores, setStores] = useState<TicketStore[]>([])
  const [cursor, setCursor] = useState<TicketCursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [storesError, setStoresError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const generation = useRef(0)
  const organizationId = access.organization.organization_id

  useEffect(() => {
    let active = true
    setStoresError('')
    listTicketStores(organizationId)
      .then((result) => { if (active) setStores(result) })
      .catch((cause: unknown) => { if (active) setStoresError(ticketServiceMessage(cause)) })
    return () => { active = false }
  }, [organizationId, refresh])

  useEffect(() => {
    const current = ++generation.current
    setLoading(true)
    setLoadingMore(false)
    setRows([])
    setCursor(null)
    setError('')
    listTicketPage(organizationId, { status: status || undefined, storeId: storeId || undefined, departmentCode: departmentCode || undefined }, null)
      .then((page) => { if (generation.current === current) { setRows(page.items); setCursor(page.nextCursor) } })
      .catch((cause: unknown) => { if (generation.current === current) setError(ticketServiceMessage(cause)) })
      .finally(() => { if (generation.current === current) setLoading(false) })
    return () => { generation.current++ }
  }, [organizationId, status, storeId, departmentCode, refresh])

  async function loadMore() {
    if (!cursor || loadingMore) return
    const current = generation.current
    setLoadingMore(true)
    setError('')
    try {
      const page = await listTicketPage(organizationId, { status: status || undefined, storeId: storeId || undefined, departmentCode: departmentCode || undefined }, cursor)
      if (generation.current !== current) return
      setRows((existing) => {
        const seen = new Set(existing.map((item) => item.ticket_id))
        return [...existing, ...page.items.filter((item) => !seen.has(item.ticket_id))]
      })
      setCursor(page.nextCursor)
    } catch (cause) { if (generation.current === current) setError(ticketServiceMessage(cause)) }
    finally { if (generation.current === current) setLoadingMore(false) }
  }

  return <div className="vy-tickets">
    <a className="vy-ticket-back" href="#/projects"><ArrowLeft size={16} /> Projects</a>
    <header className="vy-ticket-head"><div><h1>Ticket desk</h1><p>{canRouteTicket(access) ? 'Store issues across your organization.' : 'Store issues you reported or were assigned.'}</p></div>{canSubmitTicket(access) && <a className="vy-button vy-button-dark" href="#/tickets/new"><Plus size={16} /> Submit ticket</a>}</header>
    <div className="vy-ticket-filters">
      <SelectField ariaLabel="Ticket status" value={status} onChange={(value) => setStatus(value as TicketStatus | '')} options={[{ value: '', label: 'All statuses' }, ...ticketStatuses]} size="compact" />
      <SelectField ariaLabel="Ticket department" value={departmentCode} onChange={setDepartmentCode} options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((item) => ({ value: item.code, label: item.name }))]} size="compact" />
      {stores.length > 1 && <SelectField ariaLabel="Ticket store" value={storeId} onChange={setStoreId} options={[{ value: '', label: 'All stores' }, ...stores.map((item) => ({ value: item.store_id, label: item.name }))]} size="compact" />}
      <button className="vy-ticket-refresh" type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} title="Refresh tickets" aria-label="Refresh tickets"><RefreshCw size={17} /></button>
    </div>
    {storesError && <p className="vy-ticket-error" role="alert">Store filters: {storesError}</p>}
    {error && <p className="vy-ticket-error" role="alert">{error}</p>}
    {loading ? <p className="vy-ticket-message" role="status">Loading tickets...</p> : rows.length ? <>
      <div className="vy-ticket-list-head" aria-hidden="true"><span>Ticket</span><span>Team / store</span><span>Status</span><span>Updated</span></div>
      <ul className="vy-ticket-queue">{rows.map((ticket) => {
        const store = stores.find((item) => item.store_id === ticket.store_id) || access.organization.stores.find((item) => item.id === ticket.store_id)
        const team = departmentByCode(ticket.department_code)?.name || ticket.department_code
        return <li key={ticket.ticket_id}><a className="vy-list-row-link" href={`#/tickets/${ticket.ticket_id}`} aria-label={`Open ${ticket.title} ticket`}>
          <span className="vy-ticket-row-title"><strong>{ticket.title}</strong><small>{ticket.priority === 'urgent' ? 'Urgent' : ticket.priority === 'high' ? 'High priority' : ticketCategories.find((item) => item.value === ticket.category)?.label || ticket.category}</small></span>
          <span className="vy-ticket-row-meta">{team}<small>{store?.name || `Store ${ticket.store_id.slice(0, 8)}`}</small></span>
          <span className={`vy-ticket-status is-${ticket.status}`}>{statusLabel(ticket.status)}</span>
          <time dateTime={ticket.updated_at}>{dateLabel(ticket.updated_at)}</time>
        </a></li>
      })}</ul>
      {cursor && <button className="vy-button vy-ticket-more" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading...' : 'Load more tickets'}</button>}
    </> : !error && <div className="vy-ticket-empty"><h2>No tickets found</h2><p>{status || storeId || departmentCode ? 'No visible tickets match these filters.' : canRouteTicket(access) ? 'Organization tickets will appear here.' : 'Tickets you reported or can review will appear here.'}</p></div>}
  </div>
}
