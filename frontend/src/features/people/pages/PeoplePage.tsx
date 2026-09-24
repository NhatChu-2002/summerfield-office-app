import { useState } from 'react'
import { Search, Trash2, UserPlus } from 'lucide-react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate, initials } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { PersonDialog } from '../components/PersonDialog'
import { findPreviewPeople, previewRoles, togglePreviewDepartment, type PreviewPerson, type PreviewRequest, type PreviewRole } from '../model'
import './people.css'

type CurrentAccess = { name: string; email: string; organizationRole: string; departments: string[] }

export default function PeoplePage({ departments, people, requests, preview, admin, currentAccess, onPeopleChange, onRequestsChange }: {
  departments: ReferenceDepartment[]
  people: PreviewPerson[]
  requests: PreviewRequest[]
  preview: boolean
  admin: boolean
  currentAccess?: CurrentAccess
  onPeopleChange?: (people: PreviewPerson[]) => void
  onRequestsChange?: (requests: PreviewRequest[]) => void
}) {
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<string | null>(null)
  const shown = findPreviewPeople(people, query)
  const selected = people.find((person) => person.id === editor)
  const update = (person: PreviewPerson) => onPeopleChange?.(people.map((item) => item.id === person.id ? person : item))

  if (!preview && !admin) return <><header className="vy-hero vy-people-hero"><div><h1>People &amp; access</h1><p>Only organization admins can open this page.</p></div></header><p className="vy-people-unavailable">Your current organization role does not include access administration.</p></>

  function save(person: PreviewPerson) {
    onPeopleChange?.(selected ? people.map((item) => item.id === person.id ? person : item) : [...people, person])
    setEditor(null)
  }
  function addRequest(request: PreviewRequest) {
    onPeopleChange?.([...people, { id: request.id, name: request.name, email: request.email, role: 'member', departments: [] }])
    onRequestsChange?.(requests.filter((item) => item.id !== request.id))
  }

  return <>
    <header className="vy-hero vy-people-hero"><div><h1>People &amp; access</h1><p>Review team visibility, roles, and access requests.</p></div></header>
    <p className="vy-people-banner">{preview ? 'UI preview. Role and department controls are sample design states only. They do not grant access or save changes.' : 'This page is read-only until roster and access-management services are connected. Actual memberships and department assignments are managed in Team Access.'}</p>
    {!preview && currentAccess && <section className="vy-people-self" aria-labelledby="vy-people-self-title"><h2 id="vy-people-self-title">Your current access</h2><dl><div><dt>Account</dt><dd>{currentAccess.name}{currentAccess.email && ` · ${currentAccess.email}`}</dd></div><div><dt>Organization role</dt><dd>{currentAccess.organizationRole}</dd></div><div><dt>Visible departments</dt><dd>{currentAccess.departments.length ? currentAccess.departments.join(', ') : 'None assigned'}</dd></div></dl></section>}
    <div className="vy-people-layout">
      <section className="vy-people-team" aria-labelledby="vy-people-team-title">
        <div className="vy-people-section-head"><h2 id="vy-people-team-title">On the team</h2><span>{preview ? `${people.length} people` : 'Roster not connected'}</span></div>
        {preview && <label className="vy-people-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search preview team" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team" /></label>}
        {shown.length ? <ul className="vy-people-list">{shown.map((person) => <li key={person.id}>
          <div className="vy-people-avatar" aria-hidden="true">{initials(person.name)}</div>
          <div className="vy-people-info"><strong>{person.name}</strong><span>{person.email || 'No email added'}{person.position && ` · ${person.position}`}</span>
            <details className="vy-people-departments"><summary>Visible departments <span>{person.departments.length ? `${person.departments.length} selected` : 'All in preview'}</span></summary><fieldset><legend className="vy-visually-hidden">Visible departments for {person.name}</legend><div>{departments.map((item) => <label key={item.code}><input type="checkbox" checked={person.departments.includes(item.code)} onChange={() => update(togglePreviewDepartment(person, item.code))} /><span>{item.name}</span></label>)}</div></fieldset></details>
          </div>
          <div className="vy-people-row-actions"><span>Preview identity · not saved</span><button type="button" className="vy-button vy-button-small" onClick={() => setEditor(person.id)}>Details</button>
            <SelectField ariaLabel={`Access level for ${person.name}`} size="compact" value={person.role} onChange={(value) => update({ ...person, role: value as PreviewRole })} options={previewRoles.map((role) => ({ value: role.value, label: role.label }))} />
            <button type="button" className="vy-people-icon-button" title="Remove from preview" aria-label={`Remove ${person.name} from preview`} onClick={() => { if (window.confirm(`Remove ${person.name} from this preview?`)) onPeopleChange?.(people.filter((item) => item.id !== person.id)) }}><Trash2 size={15} /></button>
          </div>
        </li>)}</ul> : <p className="vy-people-empty">{preview ? people.length ? 'No people match that search.' : 'Nobody added yet.' : 'The organization roster will appear when its service is connected.'}</p>}
      </section>
      <aside className="vy-people-side">
        <section aria-labelledby="vy-people-add-title"><h2 id="vy-people-add-title">Add someone</h2><p>Connected directory search is not available here.</p><button type="button" className="vy-button vy-button-dark" disabled={!preview} onClick={() => setEditor('new')}><UserPlus size={16} /> Add by name</button></section>
        <section aria-labelledby="vy-people-waiting-title"><div className="vy-people-section-head"><h2 id="vy-people-waiting-title">Waiting for access</h2><span>{preview ? requests.length : 'Not connected'}</span></div>
          {preview && requests.length ? <ul className="vy-people-requests">{requests.map((request) => <li key={request.id}><div><strong>{request.name}</strong><span>{request.email} · asked {displayDate(request.askedAt)}</span></div><button type="button" className="vy-button vy-button-small" onClick={() => addRequest(request)}>Add in preview</button></li>)}</ul> : <p>{preview ? 'No one is waiting in this preview.' : 'Access requests are not connected yet.'}</p>}
        </section>
        <section aria-labelledby="vy-people-levels-title"><h2 id="vy-people-levels-title">What the levels mean</h2><p>These are prototype labels, not live HQ permission mappings.</p><ul className="vy-people-levels">{previewRoles.map((role) => <li key={role.value}><strong>{role.label}</strong><span>{role.note}</span></li>)}</ul></section>
      </aside>
    </div>
    {editor && <PersonDialog key={editor} person={selected} onSave={save} onClose={() => setEditor(null)} />}
  </>
}
