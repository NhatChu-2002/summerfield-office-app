import { useState } from 'react'
import { ExternalLink, Plus, Search } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { MeetingDialog } from '../components/MeetingDialog'
import { meetingLines, openMeetingActions, safeMeetingUrl, visibleMeetings, type MeetingRecord } from '../model'
import './meetings.css'

function NotesSection({ title, value }: { title: string; value: string }) {
  const lines = meetingLines(value)
  return lines.length ? <div className="vy-meeting-notes"><h4>{title}</h4><ul>{lines.map((line, index) => <li key={index}>{line}</li>)}</ul></div> : null
}

export default function MeetingsPage({ departments, projects = [], meetings, preview, onMeetingsChange }: {
  departments: ReferenceDepartment[]
  projects?: { id: string; name: string }[]
  meetings: MeetingRecord[]
  preview: boolean
  onMeetingsChange?: (meetings: MeetingRecord[]) => void
}) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [editor, setEditor] = useState<string | null>(null)
  const [focusActions, setFocusActions] = useState(false)
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const shown = visibleMeetings(meetings, query, department)
  const actions = openMeetingActions(meetings)
  const selected = meetings.find((meeting) => meeting.id === editor)
  const departmentByCode = (code: string) => allDepartments.find((item) => item.code === code)

  function save(meeting: MeetingRecord) {
    onMeetingsChange?.(selected ? meetings.map((item) => item.id === meeting.id ? meeting : item) : [meeting, ...meetings])
    setEditor(null)
  }

  return <>
    <header className="vy-hero vy-meetings-hero"><div><h1>Meetings</h1><p>Agendas, notes, decisions, and action items in one place.</p></div>
      <div className="vy-hero-actions">
        <button type="button" className="vy-button" disabled title="Drive import is not connected">Bring notes in from Drive</button>
        <button type="button" className="vy-button vy-button-dark" disabled={!preview} title={preview ? undefined : 'Shared meeting saving is not connected'} onClick={() => { setFocusActions(false); setEditor('new') }}><Plus size={16} /> New meeting</button>
      </div>
    </header>
    <p className="vy-meetings-status">{preview ? 'Sample meetings and edits stay in this Design preview until you reload. Action items do not sync to My tasks.' : 'Shared meetings are not connected yet. No company meeting records are shown here.'}</p>
    <div className="vy-meetings-layout">
      <div className="vy-meetings-main">
        <div className="vy-meetings-toolbar">
          <label className="vy-meetings-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search meetings" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meeting notes" /></label>
          <SelectField ariaLabel="Department" size="compact" value={department} onChange={setDepartment} options={[{ value: '', label: 'All departments' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} />
        </div>
        {shown.length ? <div className="vy-meetings-list">{shown.map((meeting) => {
          const team = departmentByCode(meeting.department)
          const project = projects.find((item) => item.id === meeting.projectId)
          const url = safeMeetingUrl(meeting.driveUrl)
          return <article className="vy-meeting" key={meeting.id}>
            <div className="vy-meeting-top"><h2>{meeting.title}</h2><time dateTime={meeting.date}>{displayDate(meeting.date, true)}{meeting.time && ` · ${meeting.time}`}</time></div>
            <div className="vy-meeting-meta">{team && <span className="vy-meeting-team" style={departmentStyle(team.color)}>{team.name}</span>}<span>{meeting.attendees || 'Attendees not noted'}</span>{project && <span>{project.name}</span>}<span>Saved by {meeting.savedBy}</span></div>
            <NotesSection title="Agenda" value={meeting.agenda} />
            {meeting.notes && <div className="vy-meeting-notes"><h4>Notes</h4><p>{meeting.notes}</p></div>}
            <NotesSection title="Decisions" value={meeting.decisions} />
            <NotesSection title="Action items" value={meeting.actions} />
            <div className="vy-meeting-actions">
              <button type="button" className="vy-button vy-button-small" disabled title="Email recap is not connected">Email recap</button>
              {url && <a className="vy-button vy-button-small" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open file</a>}
              {preview && <button type="button" className="vy-button vy-button-small" onClick={() => { setFocusActions(false); setEditor(meeting.id) }}>Edit</button>}
              {preview && <button type="button" className="vy-button vy-button-small" onClick={() => { setFocusActions(true); setEditor(meeting.id) }}>Add an action item</button>}
            </div>
          </article>
        })}</div> : <p className="vy-meetings-empty">{meetings.length ? 'No meetings match your search.' : preview ? 'No meetings saved yet.' : 'Meetings will appear when shared storage is connected.'}</p>}
      </div>
      <aside className="vy-meetings-side">
        <section className="vy-meetings-ask"><h2>Ask about our meetings</h2><p>AI answers from saved meeting records are not connected yet. Search the notes directly for now.</p><label>Your question<input type="text" disabled placeholder="What did we decide?" /></label><button type="button" className="vy-button vy-button-dark vy-button-small" disabled>Ask</button></section>
        <section className="vy-meetings-action-summary"><h2>Action items in notes</h2><p>{preview ? 'Listed from the preview records; these are not tracked HQ tasks.' : 'Shared action items are not connected yet.'}</p>
          {preview && (actions.length ? <ul>{actions.map((item, index) => <li key={`${item.meetingId}-${index}`}><strong>{item.action}</strong><span>{item.title} · {displayDate(item.date)}</span></li>)}</ul> : <p>No action items noted.</p>)}
        </section>
      </aside>
    </div>
    {editor && <MeetingDialog key={editor} meeting={selected} departments={allDepartments} projects={projects} focusActions={focusActions} onSave={save} onDelete={(id) => { onMeetingsChange?.(meetings.filter((item) => item.id !== id)); setEditor(null) }} onClose={() => setEditor(null)} />}
  </>
}
