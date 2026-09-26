import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Access } from '@/features/auth'
import { DEPARTMENTS } from '@/shared/config/departments'
import { SelectField } from '@/shared/ui/SelectField'
import { createTicket } from '../api'
import { canSubmitTicket, ticketCategories, ticketPriorities, ticketServiceMessage, validateTicketDraft, type TicketCategory, type TicketDraft, type TicketPriority } from '../model'

export function NewTicket({ access }: { access: Access }) {
  const [draft, setDraft] = useState<TicketDraft>({
    storeId: access.organization.stores[0]?.id || '', departmentCode: 'operations', category: 'equipment', priority: 'normal', title: '', description: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const allowed = canSubmitTicket(access)
  const update = <K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) => setDraft((previous) => ({ ...previous, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !allowed) return
    const validationError = validateTicketDraft(draft, access.organization.stores.map((item) => item.id), DEPARTMENTS.map((item) => item.code))
    if (validationError) { setError(validationError); return }
    setBusy(true)
    setError('')
    try {
      const saved = await createTicket(access.organization.organization_id, draft)
      window.location.hash = `#/tickets/${saved.id}`
    } catch (cause) { setError(ticketServiceMessage(cause)) }
    finally { setBusy(false) }
  }

  return <div className="vy-tickets">
    <a className="vy-ticket-back" href="#/tickets"><ArrowLeft size={16} /> Ticket desk</a>
    <header className="vy-ticket-head"><div><h1>Submit a ticket</h1><p>Send a store issue to the team that can resolve it.</p></div></header>
    {!allowed ? <p className="vy-ticket-message" role="status">Ticket submission requires an admin or store manager account with access to an active store.</p> : <form className="vy-ticket-form" onSubmit={(event) => void submit(event)}>
      <div className="vy-ticket-form-grid">
        <label>Store<SelectField value={draft.storeId} onChange={(value) => update('storeId', value)} options={access.organization.stores.map((item) => ({ value: item.id, label: item.name }))} /></label>
        <label>Send to team<SelectField value={draft.departmentCode} onChange={(value) => update('departmentCode', value)} options={DEPARTMENTS.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Category<SelectField value={draft.category} onChange={(value) => update('category', value as TicketCategory)} options={[...ticketCategories]} /></label>
        <label>Priority<SelectField value={draft.priority} onChange={(value) => update('priority', value as TicketPriority)} options={[...ticketPriorities]} /></label>
      </div>
      <label>What happened?<input value={draft.title} onChange={(event) => update('title', event.target.value)} required maxLength={140} placeholder="Short issue title" /></label>
      <label>Details<textarea value={draft.description} onChange={(event) => update('description', event.target.value)} maxLength={4000} rows={5} placeholder="What needs attention, and what have you tried?" /></label>
      {error && <p className="vy-ticket-error" role="alert">{error}</p>}
      <div className="vy-ticket-actions"><a className="vy-button" href="#/tickets">Cancel</a><button className="vy-button vy-button-dark" type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit ticket'}</button></div>
    </form>}
  </div>
}
