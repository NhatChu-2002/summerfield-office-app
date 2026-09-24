import { useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { companyDepartment, departmentStyle, referenceHref, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { AreaDialog } from '../components/AreaDialog'
import { ProfileDialog } from '../components/ProfileDialog'
import { contactMethods, matchingAreas, safeSopUrl, suggestedArea, type ContactProfile, type OwnershipArea, type Person } from '../model'
import './ownership.css'

type View = 'areas' | 'people'

export function WhoToAskPage({ departments, people, currentUser, areas, profiles, preview, canViewPeople, onAreasChange, onProfilesChange }: {
  departments: ReferenceDepartment[]
  people: Person[]
  currentUser: string
  areas: OwnershipArea[]
  profiles: ContactProfile[]
  preview: boolean
  canViewPeople: boolean
  onAreasChange?: (areas: OwnershipArea[]) => void
  onProfilesChange?: (profiles: ContactProfile[]) => void
}) {
  const [view, setView] = useState<View>('areas')
  const [query, setQuery] = useState('')
  const [directoryQuery, setDirectoryQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [directoryDepartment, setDirectoryDepartment] = useState('')
  const [editor, setEditor] = useState<string | null>(null)
  const [profileEditor, setProfileEditor] = useState(false)
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const byCode = (code: string) => allDepartments.find((item) => item.code === code) || companyDepartment
  const personName = (id: string) => people.find((person) => person.id === id)?.name || 'Not set'
  const matches = matchingAreas(areas, query, department)
  const suggestion = query.trim() ? suggestedArea(areas, query) : undefined
  const mine = areas.filter((area) => area.owner === currentUser || area.backup === currentUser)
  const selectedArea = areas.find((area) => area.id === editor)
  const me = people.find((person) => person.id === currentUser)
  const directory = people.filter((person) => {
    const profile = profiles.find((item) => item.id === person.id)
    if (directoryDepartment && profile?.department !== directoryDepartment) return false
    return [person.name, profile?.title, profile?.phone, profile?.email, profile?.based, profile?.notes, byCode(profile?.department || '').name]
      .some((value) => value?.toLowerCase().includes(directoryQuery.toLowerCase().trim()))
  })

  function saveArea(area: OwnershipArea) {
    onAreasChange?.(selectedArea ? areas.map((item) => item.id === area.id ? area : item) : [...areas, area])
    setEditor(null)
  }
  function saveProfile(profile: ContactProfile) {
    onProfilesChange?.(profiles.some((item) => item.id === profile.id)
      ? profiles.map((item) => item.id === profile.id ? profile : item) : [...profiles, profile])
    setProfileEditor(false)
  }
  function tabKeys(event: KeyboardEvent<HTMLDivElement>) {
    const tabs: View[] = ['areas', 'people']
    const next = event.key === 'ArrowRight' ? (tabs.indexOf(view) + 1) % 2
      : event.key === 'ArrowLeft' ? (tabs.indexOf(view) + 1) % 2
        : event.key === 'Home' ? 0 : event.key === 'End' ? 1 : -1
    if (next < 0) return
    event.preventDefault()
    setView(tabs[next])
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return <>
    <header className="vy-hero vy-own-hero"><div><h1>Who to ask</h1><p>Type what you need. HQ tells you who owns it, who covers when they're away, and how to ask.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button vy-button-dark" disabled={!preview} title={preview ? undefined : 'Shared ownership editing is not connected yet'} onClick={() => setEditor('new')}>Add an area</button><a className="vy-button" href="#/decisions">Decision chart</a>{canViewPeople && <a className="vy-button" href="#/people">People &amp; access</a>}</div></header>
    {!preview && <p className="vy-own-status">Ownership records and the team directory are not connected yet. No live assignments appear here.</p>}
    {preview && <p className="vy-own-status">Sample design data. Edits stay in this preview until you reload.</p>}
    <div className="vy-own-tabs" role="tablist" aria-label="Who to ask views" onKeyDown={tabKeys}>
      <button type="button" role="tab" id="vy-own-tab-areas" aria-controls="vy-own-panel" aria-selected={view === 'areas'} tabIndex={view === 'areas' ? 0 : -1} onClick={() => setView('areas')}>Who owns what</button>
      <button type="button" role="tab" id="vy-own-tab-people" aria-controls="vy-own-panel" aria-selected={view === 'people'} tabIndex={view === 'people' ? 0 : -1} onClick={() => setView('people')}>Team directory</button>
    </div>
    <div id="vy-own-panel" role="tabpanel" aria-labelledby={`vy-own-tab-${view}`} tabIndex={0}>
      {view === 'areas' ? <>
        {mine.length > 0 && <section className="vy-own-mine"><h2>People come to you for</h2><p>{mine.map((area) => `${area.topic}${area.backup === currentUser && area.owner !== currentUser ? ' (as cover)' : ''}`).join(' · ')}</p></section>}
        {areas.some((area) => !area.owner) && preview && <p className="vy-own-warning">{areas.filter((area) => !area.owner).length} area has no owner yet. Set one so people know who to ask.</p>}
        {areas.length > 0 && <div className="vy-own-flow" aria-label="How to find the right person"><span>You need something</span><span>Find the area below</span><span>Ask the owner</span><span>Away? Ask their cover</span><span>Still stuck? Escalate</span></div>}
        {areas.length > 0 && <div className="vy-own-map">{allDepartments.filter((item) => areas.some((area) => area.department === item.code)).map((item) => {
          const rows = areas.filter((area) => area.department === item.code)
          const owners = [...new Set(rows.map((area) => area.owner).filter(Boolean))]
          return <section key={item.code} style={departmentStyle(item.color)}><h2>{item.name}</h2>{owners.length ? owners.slice(0, 4).map((id) => { const count = rows.filter((area) => area.owner === id).length; return <p key={id}><span className="vy-own-avatar" aria-hidden="true">{personName(id).slice(0, 1)}</span>{personName(id)}<small>{count} area{count === 1 ? '' : 's'}</small></p> }) : <p>No owners set</p>}<small>{rows.length} area{rows.length === 1 ? '' : 's'}</small></section>
        })}</div>}
        <div className="vy-own-toolbar"><label className="vy-own-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="What do you need?" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. ice machine broken, invoice, new store" /></label><SelectField ariaLabel="Department" value={department} onChange={setDepartment} size="compact" options={[{ value: '', label: 'All departments' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} /></div>
        {suggestion && <div className="vy-own-suggest">For "{query}" start with <strong>{suggestion.topic}</strong> — ask {suggestion.owner ? personName(suggestion.owner) : 'the owner (not set yet)'}.</div>}
        {matches.length ? <div className="vy-own-grid">{matches.map((area) => {
          const dept = byCode(area.department)
          const sop = safeSopUrl(area.sop)
          return <article className="vy-own-area" key={area.id} style={departmentStyle(dept.color)}><div className="vy-own-area-head"><h2>{area.topic}</h2><span>{dept.name}</span></div>
            <div className="vy-own-people"><p><strong>Ask:</strong> <span className={area.owner ? '' : 'vy-own-unset'}>{area.owner ? personName(area.owner) : 'no owner yet'}</span></p><p><strong>If they're away:</strong> <span className={area.backup ? '' : 'vy-own-unset'}>{area.backup ? personName(area.backup) : 'nobody'}</span></p></div>
            <p className="vy-own-meta">{contactMethods.find((item) => item.value === area.how)?.label || contactMethods[0].label}{area.sla && ` · reply within ${area.sla}`}{area.notes && ` · ${area.notes}`}</p>
            <div className="vy-own-actions"><button type="button" className="vy-button vy-button-small vy-button-dark" disabled title="Ticket routing is not connected yet">Send them a ticket</button>{sop && <a className="vy-button vy-button-small" href={sop} target="_blank" rel="noopener noreferrer">The SOP <ArrowUpRight size={13} /></a>}<a className="vy-button vy-button-small" href={referenceHref(dept.code)}>{dept.name} page</a>{preview && <button type="button" className="vy-button vy-button-small vy-button-ghost" onClick={() => setEditor(area.id)}>Edit</button>}</div>
          </article>
        })}</div> : <p className="vy-own-empty">{areas.length ? 'Nothing matches that. Try fewer words or another department.' : preview ? 'No areas yet. Add one to begin the ownership map.' : 'Shared ownership records will appear here when connected.'}</p>}
      </> : <>
        {people.length > 0 && <p className="vy-own-warning">{people.filter((person) => !profiles.some((profile) => profile.id === person.id && profile.title && (profile.phone || profile.email))).length} people have not filled in their contact details yet.</p>}
        <div className="vy-own-toolbar"><label className="vy-own-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="Search the directory" value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Search a name, role, store or phone" /></label><SelectField ariaLabel="Department" value={directoryDepartment} onChange={setDirectoryDepartment} size="compact" options={[{ value: '', label: 'All departments' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} />{preview && me && <button type="button" className="vy-button vy-button-dark vy-button-small" onClick={() => setProfileEditor(true)}>My details</button>}</div>
        {directory.length ? <div className="vy-own-grid">{directory.map((person) => {
          const profile = profiles.find((item) => item.id === person.id)
          const owned = areas.filter((area) => area.owner === person.id)
          return <article className="vy-own-profile" key={person.id} style={departmentStyle(byCode(profile?.department || '').color)}><div className="vy-own-profile-head"><span className="vy-own-avatar" aria-hidden="true">{person.name.slice(0, 1)}</span><div><h2>{person.name}</h2><p>{profile?.title || 'Role not set'} · {byCode(profile?.department || '').name}</p></div></div>
            <dl>{profile?.phone && <><dt>Phone</dt><dd><a href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}>{profile.phone}</a></dd></>}{profile?.email && <><dt>Email</dt><dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd></>}{profile?.best && <><dt>Best way</dt><dd>{profile.best}</dd></>}{profile?.hours && <><dt>Around</dt><dd>{profile.hours}</dd></>}{profile?.based && <><dt>Based at</dt><dd>{profile.based}</dd></>}{profile?.backup && <><dt>Cover</dt><dd>{personName(profile.backup)}</dd></>}</dl>
            {profile?.notes && <p>{profile.notes}</p>}{owned.length > 0 && <p className="vy-own-profile-owns">Ask them about: {owned.map((area) => area.topic).join(', ')}</p>}{(!profile?.title || (!profile.phone && !profile.email)) && <p className="vy-own-unset">Contact details not filled in yet</p>}{preview && person.id === currentUser && <button type="button" className="vy-button vy-button-small" onClick={() => setProfileEditor(true)}>Edit my details</button>}
          </article>
        })}</div> : <p className="vy-own-empty">{people.length ? 'Nobody matches that.' : 'The team directory will appear here when connected.'}</p>}
      </>}
    </div>
    {editor && <AreaDialog key={editor} area={selectedArea} departments={allDepartments} people={people} onSave={saveArea} onDelete={(id) => { onAreasChange?.(areas.filter((area) => area.id !== id)); setEditor(null) }} onClose={() => setEditor(null)} />}
    {profileEditor && me && <ProfileDialog person={me} profile={profiles.find((item) => item.id === currentUser)} departments={allDepartments} people={people} onSave={saveProfile} onClose={() => setProfileEditor(false)} />}
  </>
}
