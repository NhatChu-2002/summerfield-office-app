import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Diamond, Trash2, X } from 'lucide-react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { TimeField } from '@/shared/ui/TimeField'
import { validateCalendarDraft, type CalendarDraft } from '../model'

const swatches = [
  ['Sage', '#B6CFAE'], ['Blue', '#BFD3D6'], ['Peach', '#F2DBC7'], ['Tan', '#CDA077'],
  ['Mist', '#E3E8E3'], ['Olive', '#C1B892'], ['Apricot', '#E6C3A3'], ['Pink', '#F2B5A7'], ['Charcoal', '#231F20'],
]

export function EventDialog({ draft, departments, onClose, onSave, onDelete }: {
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
          <label>Calendar<SelectField value={value.department} onChange={next => update('department', next)} options={departments.map(item => ({ value: item.code, label: item.name }))} /></label>
          <label>Location<SelectField value={value.location} onChange={next => update('location', next)} options={[{ value: '', label: 'Which location?' }, { value: 'company', label: 'Company-wide' }, { value: 'custom', label: 'Other location' }]} /></label>
        </div>
        {value.location === 'custom' && <label>Location name<input required maxLength={140} value={value.locationName} onChange={event => update('locationName', event.target.value)} /></label>}
        <label className="vy-event-checkbox"><input type="checkbox" checked={value.allDay} onChange={event => update('allDay', event.target.checked)} />All day</label>
        <div className="vy-event-colors" role="group" aria-label="Event colour"><span>Colour</span><button type="button" className="vy-event-default-color" aria-label="Department colour" title="Department colour" aria-pressed={!value.color} style={{ '--swatch': departmentColor } as CSSProperties} onClick={() => update('color', '')}><Diamond size={10} fill="currentColor" /></button>{swatches.map(([name, color]) => <button type="button" key={color} aria-label={`${name} event colour`} title={name} aria-pressed={value.color === color} style={{ '--swatch': color } as CSSProperties} onClick={() => update('color', color)} />)}<span className="vy-event-color-name">{value.color ? swatches.find(([, color]) => color === value.color)?.[0] : 'Department colour'}</span></div>
        <div className="vy-event-grid"><label>Starts<DateField value={value.start} required onChange={start => { setValue(item => ({ ...item, start, end: item.end && item.end < start ? start : item.end })); setError('') }} /></label><label>Ends<DateField value={value.end} min={value.start} ariaLabel="Ends. Optional; leave blank for a single-day event" onChange={next => update('end', next)} /></label>
          {!value.allDay && <><label>Start time<TimeField value={value.time} onChange={next => update('time', next)} /></label><label>End time<TimeField value={value.endTime} onChange={next => update('endTime', next)} /></label></>}
        </div>
        <div className="vy-event-grid"><label>Repeats<SelectField value={value.repeat} onChange={next => update('repeat', next as CalendarDraft['repeat'])} options={[{ value: '', label: 'Does not repeat' }, { value: 'weekly', label: 'Every week' }, { value: 'biweekly', label: 'Every 2 weeks' }, { value: 'monthly', label: 'Every month' }, { value: 'custom', label: 'Custom' }]} /></label>{value.repeat && <label>Until<DateField value={value.until} min={value.start} onChange={next => update('until', next)} /></label>}</div>
        {value.repeat === 'custom' && <div className="vy-event-grid"><label>Repeat every<input type="number" min={1} max={99} required value={value.interval} onChange={event => update('interval', Number(event.target.value))} /></label><label>Interval<SelectField value={value.unit} onChange={next => update('unit', next as CalendarDraft['unit'])} options={[{ value: 'daily', label: 'Days' }, { value: 'weekly', label: 'Weeks' }, { value: 'monthly', label: 'Months' }, { value: 'yearly', label: 'Years' }]} /></label></div>}
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
