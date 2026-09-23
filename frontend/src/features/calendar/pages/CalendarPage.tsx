import { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileDown, Plus, Printer, X } from 'lucide-react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DepartmentIcon } from '@/shared/ui/icons'
import { EventDialog } from '../components/EventDialog'
import { calendarInput, localDate, newCalendarDraft, type CalendarDraft } from '../model'
import './calendar.css'

type Props = { departments: ReferenceDepartment[]; preview: boolean; events?: CalendarDraft[]; onChange?: (events: CalendarDraft[]) => void }

export default function CalendarPage({ departments, preview, events = [], onChange }: Props) {
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
