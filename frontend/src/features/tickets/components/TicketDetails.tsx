import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { Access } from '@/features/auth'
import { departmentByCode } from '@/shared/config/departments'
import { SelectField } from '@/shared/ui/SelectField'
import { assignTicket, getTicket, listTicketAssignees, listTicketEvents, updateTicketStatus, type Ticket, type TicketAssignee, type TicketEvent } from '../api'
import { canReviewTicket, nextTicketStatuses, statusLabel, ticketCategories, ticketPriorities, ticketServiceMessage, ticketStatuses, type TicketStatus } from '../model'

const dateLabel = (value: string) => new Date(value).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export function TicketDetails({ access, ticketId }: { access: Access; ticketId: string }) {
  const organizationId = access.organization.organization_id
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [events, setEvents] = useState<TicketEvent[]>([])
  const [assignees, setAssignees] = useState<TicketAssignee[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [eventsError, setEventsError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)
  const [nextStatus, setNextStatus] = useState<TicketStatus | ''>('')
  const [note, setNote] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setEventsError('')
    getTicket(organizationId, ticketId).then((result) => {
      if (!active) return
      setTicket(result)
      if (!result) return
      setNextStatus(nextTicketStatuses(result.status)[0] || '')
      setAssigneeId(result.assignee_id || '')
      listTicketEvents(organizationId, ticketId)
        .then((items) => { if (active) setEvents(items) })
        .catch((cause: unknown) => { if (active) setEventsError(ticketServiceMessage(cause)) })
      if (canReviewTicket(access, result.department_code)) {
        listTicketAssignees(organizationId, result.department_code)
          .then((people) => { if (active) setAssignees(people) })
          .catch((cause: unknown) => { if (active) setError(`Assignee list: ${ticketServiceMessage(cause)}`) })
      }
    }).catch((cause: unknown) => { if (active) setError(ticketServiceMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [access, organizationId, ticketId, reload])

  async function refreshEvents() {
    try { setEvents(await listTicketEvents(organizationId, ticketId)); setEventsError('') }
    catch (cause) { setEventsError(ticketServiceMessage(cause)) }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ticket || !nextStatus || busy) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const updated = await updateTicketStatus(organizationId, ticket, nextStatus, note)
      setTicket(updated)
      setNextStatus(nextTicketStatuses(updated.status)[0] || '')
      setNote('')
      setSuccess('Status updated.')
      await refreshEvents()
    } catch (cause) { setError(ticketServiceMessage(cause)) }
    finally { setBusy(false) }
  }

  async function changeAssignee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ticket || busy || assigneeId === (ticket.assignee_id || '')) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const updated = await assignTicket(organizationId, ticket, assigneeId || null)
      setTicket(updated)
      setSuccess('Assignee updated.')
      await refreshEvents()
    } catch (cause) { setError(ticketServiceMessage(cause)) }
    finally { setBusy(false) }
  }

  const reviewer = ticket ? canReviewTicket(access, ticket.department_code) : false
  const store = ticket && access.organization.stores.find((item) => item.id === ticket.store_id)
  const category = ticket && ticketCategories.find((item) => item.value === ticket.category)?.label
  const priority = ticket && ticketPriorities.find((item) => item.value === ticket.priority)?.label
  const currentAssignee = ticket?.assignee_id ? assignees.find((item) => item.user_id === ticket.assignee_id) : undefined

  return (
    <div className="vy-tickets">
      <a className="vy-ticket-back" href="#/tickets"><ArrowLeft size={16} /> Ticket desk</a>
      {loading ? (
        <p className="vy-ticket-message" role="status">Loading ticket...</p>
      ) : !ticket ? (
        <div className="vy-ticket-empty">
          <h1>Ticket unavailable</h1>
          <p>{error || 'This ticket is not visible to your account.'}</p>
        </div>
      ) : (
        <>
          <header className="vy-ticket-head">
            <div>
              <span className="vy-ticket-kicker">
                {departmentByCode(ticket.department_code)?.name || ticket.department_code} · {store?.name || `Store ${ticket.store_id.slice(0, 8)}`}
              </span>
              <h1>{ticket.title}</h1>
              <p>Reported {dateLabel(ticket.created_at)}</p>
            </div>
            <button className="vy-ticket-refresh" type="button" onClick={() => setReload((value) => value + 1)} title="Reload ticket" aria-label="Reload ticket">
              <RefreshCw size={17} />
            </button>
          </header>
          <div className="vy-ticket-detail-meta">
            <span className={`vy-ticket-status is-${ticket.status}`}>{statusLabel(ticket.status)}</span>
            <span>{category || ticket.category}</span>
            <span>{priority || ticket.priority} priority</span>
            <span>{ticket.assignee_id ? `Assigned to ${currentAssignee?.display_name || (ticket.assignee_id === access.userId ? 'you' : 'a teammate')}` : 'Unassigned'}</span>
          </div>
          {error && <p className="vy-ticket-error" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Reload</button></p>}
          {success && <p className="vy-ticket-success" role="status">{success}</p>}
          <section className="vy-ticket-detail-section">
            <h2>Issue</h2>
            <p className="vy-ticket-description">{ticket.description || 'No further details were provided.'}</p>
          </section>
          {reviewer && (
            <div className="vy-ticket-review">
              <section className="vy-ticket-detail-section">
                <h2>Move ticket</h2>
                <form onSubmit={(event) => void changeStatus(event)}>
                  <label>Next status
                    <SelectField value={nextStatus} onChange={(value) => setNextStatus(value as TicketStatus)} options={nextTicketStatuses(ticket.status).map((value) => ({ value, label: statusLabel(value) }))} />
                  </label>
                  <label><span>Note <small>(optional)</small></span>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} />
                  </label>
                  <button className="vy-button vy-button-dark" type="submit" disabled={busy || !nextStatus}>{busy ? 'Saving...' : 'Update status'}</button>
                </form>
              </section>
              <section className="vy-ticket-detail-section">
                <h2>Assign</h2>
                <form onSubmit={(event) => void changeAssignee(event)}>
                  <label>Team member
                    <SelectField value={assigneeId} onChange={setAssigneeId} options={[
                      { value: '', label: 'Unassigned' },
                      ...(!currentAssignee && ticket.assignee_id ? [{ value: ticket.assignee_id, label: 'Current assignee' }] : []),
                      ...assignees.map((item) => ({ value: item.user_id, label: item.display_name })),
                    ]} />
                  </label>
                  <button className="vy-button" type="submit" disabled={busy || assigneeId === (ticket.assignee_id || '')}>{busy ? 'Saving...' : 'Save assignment'}</button>
                </form>
              </section>
            </div>
          )}
          <section className="vy-ticket-detail-section vy-ticket-events">
            <h2>Activity</h2>
            {eventsError && <p className="vy-ticket-error" role="alert">Activity could not be loaded: {eventsError}</p>}
            {events.length ? (
              <ol>{events.map((item) => <li key={item.event_id}>
                <div>
                  <strong>{item.event_type === 'created' ? 'Ticket submitted' : item.event_type === 'assigned' ? 'Assignment changed' : `Moved to ${ticketStatuses.find((status) => status.value === item.to_value)?.label || item.to_value}`}</strong>
                  <time dateTime={item.created_at}>{dateLabel(item.created_at)}</time>
                </div>
                {item.body && <p>{item.body}</p>}
              </li>)}</ol>
            ) : !eventsError && <p className="vy-ticket-message">No activity recorded.</p>}
          </section>
        </>
      )}
    </div>
  )
}
