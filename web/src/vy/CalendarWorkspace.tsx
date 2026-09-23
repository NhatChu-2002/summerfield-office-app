import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Diamond, FileDown, Plus, Printer, Trash2, X } from 'lucide-react'
import { DepartmentIcon } from './icons'
import { calendarInput, localDate, newCalendarDraft, validateCalendarDraft, type CalendarDraft } from './calendar-model'
import type { ReferenceDepartment } from './reference'
import './calendar.css'

type Props = { departments: ReferenceDepartment[]; preview: boolean; events?: CalendarDraft[]; onChange?: (events: CalendarDraft[]) => void }
const swatches = [
  ['Sage', '#B6CFAE'], ['Blue', '#BFD3D6'], ['Peach', '#F2DBC7'], ['Tan', '#CDA077'],
  ['Mist', '#E3E8E3'], ['Olive', '#C1B892'], ['Apricot', '#E6C3A3'], ['Pink', '#F2B5A7'], ['Charcoal', '#231F20'],
]

export default function CalendarWorkspace({ departments, preview, events = [], onChange }: Props) {
  const calendar = useRef<FullCalendar>(null)
  const root = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
  const [mode, setMode] = useState('dayGridMonth')
  const chosenMode = useRef<string | null>(null)
  const [hidden, setHidden] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState<CalendarDraft | null>(null)
  const [message, setMessage] = useState('')
  const writable = preview && !!onChange && departments.length > 0
  const inputs = useMemo(() => events.filter(event => !hidden.includes(event.department))
    .map(event => calendarInput(event, departments)), [events, hidden, departments])

  useEffect(() => {
    if (!root.current) return
    const observer = new ResizeObserver(([entry]) => {
      const target = chosenMode.current || (entry.contentRect.width < 680 ? 'listMonth' : 'dayGridMonth')
      setMode(target)
      const api = calendar.current?.getApi()
      if (api && api.view.type !== target) api.changeView(target)
      api?.updateSize()
    })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])

  const newEvent = (date = localDate()) => {
    if (!writable) return
    const first = departments.find(item => !hidden.includes(item.code)) || departments[0]
    setDraft(newCalendarDraft(first.code, date))
    setMessage('')
  }
  const save = (event: CalendarDraft) => {
    if (!writable) return
    const saved = { ...event, title: event.title.trim(), id: event.id || crypto.randomUUID() }
    onChange?.([...events.filter(item => item.id !== saved.id), saved])
    setHidden(items => items.filter(code => code !== saved.department))
    calendar.current?.getApi().gotoDate(saved.start)
    setDraft(null)
    setMessage(event.id ? 'Preview event updated.' : 'Preview event added.')
  }
  const switchMode = (value: string) => {
    chosenMode.current = value
    setMode(value)
    calendar.current?.getApi().changeView(value)
  }

  return <div className="vy-calendar-page" ref={root}>
    <div className="vy-preview-note">{preview ? <><b>Calendar preview.</b> Events are temporary and clear when you exit preview. Nothing is sent to your team.</> : <><b>Calendar not connected.</b> Shared events and editing will be available after the calendar API is connected.</>}</div>
    <header className="vy-calendar-head">
      <div className="vy-calendar-period">
        <button className="vy-icon-button" type="button" aria-label="Previous month" title="Previous month" onClick={() => calendar.current?.getApi().prev()}><ChevronLeft size={18} /></button>
        <h1 aria-live="polite"><span className="sr-only">Team calendar: </span>{title}</h1>
        <button className="vy-icon-button" type="button" aria-label="Next month" title="Next month" onClick={() => calendar.current?.getApi().next()}><ChevronRight size={18} /></button>
        <button className="vy-button vy-button-small" type="button" onClick={() => calendar.current?.getApi().today()}>Today</button>
      </div>
      <div className="vy-calendar-actions">
        <div className="vy-layout-picker" role="group" aria-label="Calendar view"><button type="button" aria-pressed={mode === 'dayGridMonth'} onClick={() => switchMode('dayGridMonth')}>Month</button><button type="button" aria-pressed={mode === 'listMonth'} onClick={() => switchMode('listMonth')}>List</button></div>
        <button className="vy-icon-button" type="button" title="Save as PDF using the print dialog" aria-label="Save calendar as PDF" onClick={() => window.print()}><FileDown size={18} /></button>
        <button className="vy-icon-button" type="button" title="Print calendar" aria-label="Print calendar" onClick={() => window.print()}><Printer size={18} /></button>
        <button className="vy-button vy-button-dark" type="button" disabled={!writable} onClick={() => newEvent()}><Plus size={16} />New event</button>
      </div>
    </header>
    {message && <div className="vy-calendar-message" role="status">{message}<button className="vy-icon-button" type="button" aria-label="Dismiss calendar message" onClick={() => setMessage('')}><X size={14} /></button></div>}
    <div className="vy-calendar-layout">
      <aside className={`vy-calendar-filters ${filtersOpen ? 'is-open' : ''}`} aria-label="Calendar filters">
        <h2>Calendars</h2><button className="vy-calendar-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="calendar-filters" onClick={() => setFiltersOpen(!filtersOpen)}><CalendarDays size={18} />Calendars <span>{departments.length - hidden.filter(code => departments.some(d => d.code === code)).length} selected</span><ChevronDown size={16} /></button>
        <div className="vy-calendar-filter-body" id="calendar-filters">
          {departments.map(department => <div className="vy-calendar-filter-row" key={department.code}>
            <label><input type="checkbox" checked={!hidden.includes(department.code)} onChange={event => setHidden(list => event.target.checked ? list.filter(code => code !== department.code) : [...list, department.code])} /><span className="vy-calendar-swatch" style={{ background: department.color }} /><span>{department.name}</span></label>
            <button type="button" title={`Show only ${department.name}`} aria-label={`Show only ${department.name}`} onClick={() => setHidden(departments.filter(item => item.code !== department.code).map(item => item.code))}>only</button>
          </div>)}
          <div className="vy-calendar-filter-actions"><button className="vy-button vy-button-small" type="button" onClick={() => setHidden([])}>Show all</button><button className="vy-button vy-button-ghost vy-button-small" type="button" onClick={() => setHidden(departments.map(item => item.code))}>Hide all</button></div>
          <details className="vy-calendar-legend"><summary>What the colours mean</summary>{departments.map(item => <div key={item.code}><DepartmentIcon code={item.code} size={15} /><span>{item.name}<small>{item.full}</small></span></div>)}</details>
          <section className="vy-calendar-google"><h3>Google Calendar</h3><p>Not connected</p><button className="vy-button vy-button-small" type="button" disabled title="Google Calendar integration is not connected">Connect Google Calendar</button></section>
        </div>
      </aside>
      <section className="vy-calendar-surface" aria-label="Team calendar">
        <FullCalendar ref={calendar} plugins={[dayGridPlugin, listPlugin, interactionPlugin, rrulePlugin]} initialView="dayGridMonth" headerToolbar={false}
          height="auto" fixedWeekCount dayMaxEvents={3} events={inputs} eventDisplay="block" eventInteractive={writable} firstDay={0}
          datesSet={info => setTitle(info.view.title)} eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          dateClick={info => newEvent(info.dateStr)} eventClick={info => { const event = events.find(item => item.id === info.event.id); if (event && writable) setDraft({ ...event }) }}
          eventDidMount={info => { info.el.title = `${info.event.title}${info.event.extendedProps.where ? ` - ${info.event.extendedProps.where}` : ''}` }}
          dayCellContent={info => <button type="button" className="vy-calendar-day" disabled={!writable} aria-current={info.isToday ? 'date' : undefined}
            aria-label={`${info.date.toLocaleDateString('en-US', { dateStyle: 'full' })}${writable ? ', add event' : ''}`}
            onClick={event => { event.stopPropagation(); newEvent(localDate(info.date)) }}>{info.dayNumberText}</button>}
          noEventsContent={preview ? 'No events on the selected calendars this month.' : 'Shared calendar data is not connected.'}
        />
      </section>
    </div>
    {draft && <EventDialog key={draft.id || 'new'} draft={draft} departments={departments} onClose={() => setDraft(null)} onSave={save}
      onDelete={() => { if (!writable) return; onChange?.(events.filter(item => item.id !== draft.id)); setDraft(null); setMessage('Preview event deleted.'); }} />}
  </div>
}

function EventDialog({ draft, departments, onClose, onSave, onDelete }: {
  draft: CalendarDraft; departments: ReferenceDepartment[]; onClose: () => void; onSave: (event: CalendarDraft) => void; onDelete: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(draft)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    node?.querySelector<HTMLInputElement>('input')?.focus()
    return () => node?.close()
  }, [])
  const update = <K extends keyof CalendarDraft>(key: K, next: CalendarDraft[K]) => { setValue(item => ({ ...item, [key]: next })); setError(''); setConfirmDelete(false) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validateCalendarDraft(value)
    if (problem) { setError(problem); return }
    onSave(value)
  }
  const departmentColor = departments.find(item => item.code === value.department)?.color || '#B6CFAE'
  return <dialog className="vy-event-dialog" ref={dialog} onCancel={onClose} aria-labelledby="event-title">
    <form onSubmit={submit}>
      <header><h2 id="event-title">{draft.id ? 'Edit event' : 'New event'}</h2><button className="vy-icon-button" type="button" aria-label="Close event" onClick={onClose}><X size={20} /></button></header>
      <div className="vy-event-fields">
        {draft.id && draft.repeat && <p className="vy-event-series">Changes apply to the whole series.</p>}
        <label>Title<input autoFocus required maxLength={140} value={value.title} onChange={event => update('title', event.target.value)} /></label>
        <div className="vy-event-grid">
          <label>Calendar<select aria-label="Calendar" value={value.department} onChange={event => update('department', event.target.value)}>{departments.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
          <label>Location<select aria-label="Location" value={value.location} onChange={event => update('location', event.target.value)}><option value="">Which location?</option><option value="company">Company-wide</option><option value="custom">Other location</option></select></label>
        </div>
        {value.location === 'custom' && <label>Location name<input required maxLength={140} value={value.locationName} onChange={event => update('locationName', event.target.value)} /></label>}
        <label className="vy-event-checkbox"><input type="checkbox" checked={value.allDay} onChange={event => update('allDay', event.target.checked)} />All day</label>
        <div className="vy-event-colors" role="group" aria-label="Event colour"><span>Colour</span><button type="button" className="vy-event-default-color" aria-label="Department colour" title="Department colour" aria-pressed={!value.color} style={{ '--swatch': departmentColor } as CSSProperties} onClick={() => update('color', '')}><Diamond size={10} fill="currentColor" /></button>{swatches.map(([name, color]) => <button type="button" key={color} aria-label={`${name} event colour`} title={name} aria-pressed={value.color === color} style={{ '--swatch': color } as CSSProperties} onClick={() => update('color', color)} />)}<span className="vy-event-color-name">{value.color ? swatches.find(([, color]) => color === value.color)?.[0] : 'Department colour'}</span></div>
        <div className="vy-event-grid"><label>Starts<input type="date" required value={value.start} onInput={event => { const start = event.currentTarget.value; setValue(item => ({ ...item, start, end: item.end && item.end < start ? start : item.end })); setError('') }} /></label><label>Ends<input type="date" aria-description="Optional. Leave blank for a single-day event." min={value.start} value={value.end} onInput={event => update('end', event.currentTarget.value)} /></label>
          {!value.allDay && <><label>Start time<input type="time" required value={value.time} onInput={event => update('time', event.currentTarget.value)} /></label><label>End time<input type="time" required value={value.endTime} onInput={event => update('endTime', event.currentTarget.value)} /></label></>}
        </div>
        <div className="vy-event-grid"><label>Repeats<select value={value.repeat} onChange={event => update('repeat', event.target.value as CalendarDraft['repeat'])}><option value="">Does not repeat</option><option value="weekly">Every week</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Every month</option><option value="custom">Custom</option></select></label>{value.repeat && <label>Until<input type="date" min={value.start} value={value.until} onInput={event => update('until', event.currentTarget.value)} /></label>}</div>
        {value.repeat === 'custom' && <div className="vy-event-grid"><label>Repeat every<input type="number" min={1} max={99} required value={value.interval} onChange={event => update('interval', Number(event.target.value))} /></label><label>Interval<select value={value.unit} onChange={event => update('unit', event.target.value as CalendarDraft['unit'])}><option value="daily">Days</option><option value="weekly">Weeks</option><option value="monthly">Months</option><option value="yearly">Years</option></select></label></div>}
        <details className="vy-event-invites">
          <summary>Invite other teams or people</summary>
          <fieldset><legend>Teams</legend><div className="vy-event-invite-teams">{departments.filter(item => item.code !== 'company').map(item => <label className="vy-event-checkbox" key={item.code}><input type="checkbox" checked={value.inviteDepartments.includes(item.code)} onChange={event => update('inviteDepartments', event.target.checked ? [...value.inviteDepartments, item.code] : value.inviteDepartments.filter(code => code !== item.code))} />{item.name}</label>)}</div></fieldset>
          <label>People<input disabled placeholder="People directory not connected" /></label>
          <p>Selections stay in this preview. No invitations are sent.</p>
        </details>
        <label>Where<input maxLength={140} value={value.where} placeholder="Store, address or meeting link" onChange={event => update('where', event.target.value)} /></label>
        <label>Notes<textarea maxLength={2000} rows={3} value={value.notes} onChange={event => update('notes', event.target.value)} /></label>
        {error && <p className="vy-event-error" role="alert">{error}</p>}
        {confirmDelete && <div className="vy-event-error" role="alert"><p>Delete {draft.repeat ? 'this entire series' : 'this preview event'}?</p><button className="vy-button vy-button-small" type="button" onClick={onDelete}>Confirm deletion</button></div>}
      </div>
      <footer>{draft.id && <button className="vy-icon-button vy-event-delete" type="button" title="Delete event" aria-label="Delete event" onClick={() => setConfirmDelete(true)}><Trash2 size={18} /></button>}<span>Preview only. Not shared or saved.</span><button className="vy-button" type="button" onClick={onClose}>Cancel</button><button className="vy-button vy-button-dark" type="submit">{draft.id ? 'Save changes' : 'Save event'}</button></footer>
    </form>
  </dialog>
}
