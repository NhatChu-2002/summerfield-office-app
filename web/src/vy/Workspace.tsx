import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Bell, Folder, LogOut, Plus, RefreshCw, Search, X } from 'lucide-react'
import { departmentRole, type Access, type HqTask, type HqUpdate } from '../lib/data'
import { DepartmentIcon, SectionIcon } from './icons'
import { SunnyPet } from './SunnyPet'
import { companyDepartment, referenceDepartments, referenceForDepartment, referenceHref, referenceNav, sortLikeReference, type ReferenceDepartment } from './reference'
import './workspace.css'

type Route = { page: string; code?: string }
type Layout = 'auto' | 'phone' | 'desktop'

const greeting = () => `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}`
const codeStyle = (color: string): CSSProperties => ({ '--vy-color': color, '--vy-foreground': color === '#231F20' ? '#fff' : '#231f20' } as CSSProperties)
const readHiddenCards = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('sfhq_hidden_department_cards') || '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch { return [] }
}

function LayoutPicker({ layout, onChange }: { layout: Layout; onChange: (value: Layout) => void }) {
  return <div className="vy-layout-picker" role="group" aria-label="Layout">
    {(['auto', 'phone', 'desktop'] as const).map((value) => <button type="button" aria-pressed={layout === value} key={value} onClick={() => onChange(value)}>{value === 'auto' ? 'Auto' : value === 'phone' ? 'Phone' : 'Desktop'}</button>)}
  </div>
}

export function WorkspaceShell({ access, route, preview, children, onRefresh, refreshing, onOrganization, onSignOut, onExitPreview, onEnterPreview }: {
  access: Access; route: Route; preview: boolean; children: ReactNode; onRefresh: () => void;
  refreshing: boolean; onOrganization: (id: string) => void; onSignOut: () => void; onExitPreview: () => void; onEnterPreview?: () => void
}) {
  const [layout, setLayout] = useState<Layout>('auto')
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [myDepartment, setMyDepartment] = useState(() => localStorage.getItem('sfhq_my_department') || '')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const selectMine = (code: string) => { setMyDepartment(code); localStorage.setItem('sfhq_my_department', code); window.dispatchEvent(new Event('sfhq-my-department')) }
  useEffect(() => { setMoreOpen(false); setSearchOpen(false); window.scrollTo(0, 0) }, [route.page, route.code])
  useEffect(() => {
    const update = () => setMyDepartment(localStorage.getItem('sfhq_my_department') || '')
    window.addEventListener('sfhq-my-department', update)
    return () => window.removeEventListener('sfhq-my-department', update)
  }, [])
  const visibleDepartments = preview ? [companyDepartment, ...referenceDepartments] : sortLikeReference(access.departments.map(referenceForDepartment))
  const selected = route.page === 'department' ? route.code : route.page
  const mobile = layout === 'phone'
  const departmentOptions = visibleDepartments.filter((item) => item.code !== 'company')

  return <div className={`vy-shell ${mobile ? 'vy-force-phone' : ''} ${layout === 'desktop' ? 'vy-force-desktop' : ''}`}>
    <aside className="vy-rail" aria-label="Summerfield HQ">
      <a className="vy-mark" href="#/"><strong>Summerfield</strong><span>TEA BAR · HQ</span></a>
      <nav className="vy-rail-nav" aria-label="Main navigation">{referenceNav.filter((item) => item.key !== 'people' || access.organization.role === 'admin' || preview).map((item) => <a key={item.key} className={selected === item.key ? 'is-active' : ''} aria-current={selected === item.key ? 'page' : undefined} href={item.href}><span className="vy-nav-icon"><SectionIcon name={item.key} /></span>{item.label}</a>)}</nav>
      <div className="vy-rail-heading">Departments</div>
      <nav className="vy-rail-nav vy-department-nav" aria-label="Departments">
        {visibleDepartments.map((item) => <a key={item.code} className={selected === item.code ? 'is-active' : ''} aria-current={selected === item.code ? 'page' : undefined} title={preview ? undefined : `${item.name}: ${access.organization.role === 'admin' ? 'admin' : departmentRole(access, item.code)} access`} href={referenceHref(item.code)}><span className="vy-nav-icon"><DepartmentIcon code={item.code} /></span>{item.name}</a>)}
      </nav>
      <div className="vy-rail-foot">
        <label>My department<select value={departmentOptions.some((item) => item.code === myDepartment) ? myDepartment : ''} onChange={(event) => selectMine(event.target.value)}><option value="">Choose…</option>{departmentOptions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <div className="vy-rail-view-label">View</div><LayoutPicker layout={layout} onChange={setLayout} />
        <div className="vy-rail-account"><span>{access.displayName}<small>{preview ? 'Design preview' : `${access.organization.organization_name} · ${access.organization.role}`}</small></span>{preview ? <button type="button" onClick={onExitPreview}>Exit preview</button> : <button type="button" onClick={onSignOut}><LogOut size={14} /> Sign out</button>}</div>
      </div>
    </aside>
    <div className="vy-body">
      <header className="vy-topbar">
        <a href="#/" className="vy-topbar-brand">Summerfield HQ</a>
        <div className="vy-topbar-right"><LayoutPicker layout={layout} onChange={setLayout} /><label className="vy-topbar-dept"><span className="sr-only">My department</span><select value={departmentOptions.some((item) => item.code === myDepartment) ? myDepartment : ''} onChange={(event) => selectMine(event.target.value)}><option value="">Choose…</option>{departmentOptions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></div>
      </header>
      <div className="vy-utility"><span>{preview ? 'Design preview · changes are not saved' : `${access.organization.organization_name} · ${access.displayName}`}</span><div>{onEnterPreview && <button className="vy-preview-switch" type="button" onClick={onEnterPreview}>Design preview</button>}<button type="button" className="vy-icon-button" aria-label="Refresh HQ data" title="Refresh HQ data" onClick={onRefresh} disabled={preview || refreshing}><RefreshCw size={17} className={refreshing ? 'spinning' : ''} /></button><button type="button" className="vy-icon-button" aria-label="Notifications" title="Notifications" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={17} /></button>{!preview && access.organizations.length > 1 && <label className="vy-org"><span className="sr-only">Organization</span><select value={access.organization.organization_id} onChange={(event) => onOrganization(event.target.value)}>{access.organizations.map((item) => <option key={item.organization_id} value={item.organization_id}>{item.organization_name}</option>)}</select></label>}</div></div>
      {notificationOpen && <div className="vy-notification" role="status">Notifications will appear here after that workflow is connected.<button type="button" aria-label="Close notifications" onClick={() => setNotificationOpen(false)}><X size={15} /></button></div>}
      <main className="vy-main" id="main-content">{children}</main>
    </div>
    <SunnyPet layout={layout} />
    <nav className="vy-mobile-tabs" aria-label="Sections"><a href="#/" className={selected === 'dashboard' ? 'is-active' : ''}><SectionIcon name="dashboard" size={20} />Dashboard</a><a href="#/calendar" className={selected === 'calendar' ? 'is-active' : ''}><SectionIcon name="calendar" size={20} />Calendar</a><a href="#/tasks" className={selected === 'tasks' ? 'is-active' : ''}><SectionIcon name="tasks" size={20} />Tasks</a><button type="button" onClick={() => setSearchOpen(true)}><SectionIcon name="search" size={20} />Search</button><button type="button" onClick={() => setMoreOpen(true)}><SectionIcon name="more" size={20} />More</button></nav>
    {(moreOpen || searchOpen) && <div className="vy-sheet-scrim" onClick={() => { setMoreOpen(false); setSearchOpen(false) }}><div className="vy-sheet" role="dialog" aria-modal="true" aria-label={searchOpen ? 'Search HQ sections' : 'More sections'} onClick={(event) => event.stopPropagation()}><div className="vy-sheet-head"><h2>{searchOpen ? 'Search HQ' : 'More'}</h2><button type="button" className="vy-icon-button" aria-label="Close" onClick={() => { setMoreOpen(false); setSearchOpen(false) }}><X size={18} /></button></div>{searchOpen && <label className="vy-search-field"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a section or department" /></label>}<div className="vy-sheet-links">{referenceNav.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).map((item) => <a key={item.key} href={item.href}><SectionIcon name={item.key} />{item.label}</a>)}{visibleDepartments.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => <a key={item.code} href={referenceHref(item.code)}><DepartmentIcon code={item.code} />{item.name}</a>)}</div><div className="vy-sheet-account">{access.displayName} · {preview ? <button type="button" onClick={onExitPreview}>Exit preview</button> : <><button type="button" onClick={onEnterPreview}>Design preview</button><button type="button" onClick={onSignOut}>Sign out</button></>}</div></div></div>}
  </div>
}

function ReferenceButton({ children }: { children: ReactNode }) {
  return <button type="button" className="vy-button vy-button-small" disabled title="Available in a later migration phase">{children}</button>
}

function DepartmentCard({ department, myDepartment }: { department: ReferenceDepartment; myDepartment: string }) {
  return <article className="vy-department-card" style={codeStyle(department.color)}>
    <div className="vy-department-card-head"><div className="vy-card-title"><h3><DepartmentIcon code={department.code} size={22} /> {department.name}</h3>{myDepartment === department.code && <span className="vy-tag">My department</span>}</div><p>{department.full}</p></div>
    <div className="vy-department-card-body"><p className="vy-muted">Nothing on the calendar in the next 6 weeks</p><div className="vy-folder-lines">{department.folders.slice(0, 3).map((folder) => <span key={folder}><Folder size={13} fill="#c79a73" strokeWidth={1.5} />{folder}</span>)}{department.folders.length > 3 && <a href={referenceHref(department.code)}>+{department.folders.length - 3} more</a>}</div><div className="vy-card-actions"><a className="vy-button vy-button-dark vy-button-small" href={referenceHref(department.code)}>Open {department.name}</a>{department.tool && <ReferenceButton>{department.tool}</ReferenceButton>}</div></div>
  </article>
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="vy-panel"><div className="vy-panel-head"><h2>{title}</h2>{action}</div>{children}</section>
}

export function WorkspaceDashboard({ access, tasks, updates, preview, dataReady, taskContent, updateContent }: {
  access: Access; tasks: HqTask[]; updates: HqUpdate[]; preview: boolean; dataReady: boolean;
  taskContent: ReactNode; updateContent: ReactNode
}) {
  const [tour, setTour] = useState(() => localStorage.getItem('sfhq_tour_dismissed') !== '1')
  const [tourOpen, setTourOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState<string[]>(readHiddenCards)
  useEffect(() => localStorage.setItem('sfhq_hidden_department_cards', JSON.stringify(hidden)), [hidden])
  const [myDepartment, setMyDepartment] = useState(() => localStorage.getItem('sfhq_my_department') || '')
  useEffect(() => {
    const update = () => setMyDepartment(localStorage.getItem('sfhq_my_department') || '')
    window.addEventListener('sfhq-my-department', update)
    return () => window.removeEventListener('sfhq-my-department', update)
  }, [])
  const departments = preview ? referenceDepartments : sortLikeReference(access.departments.map(referenceForDepartment))
  const visible = departments.filter((item) => !hidden.includes(item.code))
  const openTasks = tasks.filter((item) => item.status === 'open' && item.assigned_to === access.userId)
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return <>
    <div className="vy-preview-note">{preview ? <><b>Design preview.</b> Explore the new HQ interface. Company data is not connected and changes are not saved.</> : !dataReady ? <><b>Data unavailable.</b> Task and update totals are hidden until HQ data loads.</> : <><b>HQ workspace.</b> Tasks and team updates are connected; other sections are being rebuilt.</>}</div>
    <header className="vy-hero vy-home-hero"><div><h1>{greeting()}</h1><p>{date}. Every department’s tools, folders and dates in one place.</p></div><div className="vy-hero-actions"><a className="vy-button" href="#/projects">Projects</a><button className="vy-button" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit layout'}</button><ReferenceButton><Plus size={15} /> New event</ReferenceButton></div></header>
    {tour && <div className="vy-tour-banner"><b>New here?</b> Take the two-minute tour and you’ll know where everything lives.<div className="vy-tour-actions"><button className="vy-button vy-button-dark vy-button-small" type="button" onClick={() => setTourOpen(true)}>Show me around</button><a className="vy-button vy-button-small" href="#/help">All the guides</a><button className="vy-button vy-button-ghost vy-button-small" type="button" onClick={() => { setTour(false); localStorage.setItem('sfhq_tour_dismissed', '1') }}>No thanks</button></div></div>}
    {editing && <div className="vy-layout-editor"><strong>Department cards</strong><span>Choose what appears on this dashboard.</span><div>{departments.map((item) => <label key={item.code}><input type="checkbox" checked={!hidden.includes(item.code)} onChange={(event) => setHidden((list) => event.target.checked ? list.filter((code) => code !== item.code) : [...list, item.code])} /> {item.name}</label>)}</div></div>}
    <div className="vy-dashboard-grid">{visible.map((item) => <DepartmentCard key={item.code} department={item} myDepartment={myDepartment} />)}</div>
    <div className="vy-dashboard-lower"><Panel title="My tasks" action={<a className="vy-panel-link" href="#/tasks">All my tasks <ArrowRight size={15} /></a>}>{dataReady ? taskContent : <p className="vy-empty">{preview ? 'Task data is not connected in this preview.' : 'Task data is temporarily unavailable.'}</p>}</Panel><Panel title="Next two weeks" action={<a className="vy-panel-link" href="#/calendar">Open calendar <ArrowRight size={15} /></a>}><p className="vy-empty">Calendar data will appear here after migration.</p></Panel><Panel title="Team notes" action={<a className="vy-panel-link" href="#/updates">All updates <ArrowRight size={15} /></a>}>{dataReady ? updateContent : <p className="vy-empty">{preview ? 'Team notes are not connected in this preview.' : 'Team notes are temporarily unavailable.'}</p>}</Panel><Panel title="Running projects" action={<a className="vy-panel-link" href="#/projects">All projects <ArrowRight size={15} /></a>}><p className="vy-empty">Project records will appear here after migration.</p></Panel><Panel title="Who to ask" action={<a className="vy-panel-link" href="#/ask">Open the list <ArrowRight size={15} /></a>}><label className="vy-mini-search">What do you need?<input disabled placeholder="Search team owners" /></label></Panel><Panel title="Decision chart" action={<a className="vy-panel-link" href="#/decisions">Open the chart <ArrowRight size={15} /></a>}><p className="vy-empty">Decision owners are not connected yet.</p></Panel><Panel title="Files & links" action={<ReferenceButton><Plus size={14} /> Add a link</ReferenceButton>}><p className="vy-empty">Shared files will appear here after migration.</p></Panel></div>
    {tourOpen && <div className="vy-modal-scrim" onClick={() => setTourOpen(false)}><div className="vy-tour-dialog" role="dialog" aria-modal="true" aria-labelledby="vy-tour-title" onClick={(event) => event.stopPropagation()}><button className="vy-icon-button vy-close" type="button" aria-label="Close tour" onClick={() => setTourOpen(false)}><X size={18} /></button><img src="/sunny-base.webp" alt="" /><h2 id="vy-tour-title">Welcome to Summerfield HQ</h2><p>Start with a department card to find its work and folders. My tasks keeps your assignments together, while Team notes shares updates across your teams.</p><div className="vy-tour-dialog-actions"><a className="vy-button vy-button-dark" href={departments[0] ? referenceHref(departments[0].code) : '#/'} onClick={() => setTourOpen(false)}>Explore a department <ArrowRight size={15} /></a><button className="vy-button" type="button" onClick={() => setTourOpen(false)}>Stay here</button></div></div></div>}
    {dataReady && <span className="sr-only">{openTasks.length} open tasks assigned to you. {updates.length} team updates.</span>}
  </>
}

export function WorkspaceDepartment({ department, role, myDepartment, onSetMine, taskContent, updateContent, onNewTask, writable, dataReady }: {
  department: ReferenceDepartment; role: string; myDepartment: boolean; onSetMine: () => void;
  taskContent: ReactNode; updateContent: ReactNode; onNewTask: () => void; writable: boolean; dataReady: boolean
}) {
  const [isMine, setIsMine] = useState(myDepartment)
  const preview = role === 'Preview'
  useEffect(() => {
    const update = () => setIsMine(localStorage.getItem('sfhq_my_department') === department.code)
    window.addEventListener('sfhq-my-department', update)
    return () => window.removeEventListener('sfhq-my-department', update)
  }, [department.code])
  return <>
    <header className="vy-hero vy-department-hero" style={codeStyle(department.color)}><div><h1><DepartmentIcon code={department.code} size={34} /> {department.name} dashboard</h1><p>{department.full}</p>{!preview && <span className="vy-department-access">{role} access</span>}</div><div className="vy-hero-actions">{department.tool && <ReferenceButton>Open {department.tool}</ReferenceButton>}<ReferenceButton><Plus size={15} /> New {department.name} event</ReferenceButton><ReferenceButton>Email this team</ReferenceButton>{!isMine && <button className="vy-button" type="button" onClick={() => { onSetMine(); setIsMine(true) }}>Make this my department</button>}</div></header>
    {!dataReady && <div className="vy-preview-note">{preview ? 'Design preview: department records are not connected, and changes are not saved.' : 'Task and update data is temporarily unavailable. Actions that save records are paused.'}</div>}
    <div className="vy-department-columns"><div className="vy-stack"><Panel title="Coming up" action={<label className="vy-checkbox" title="Calendar visibility is available after the calendar migration"><input type="checkbox" checked disabled /> Show on my calendar</label>}><p className="vy-empty">Nothing on the {department.name} calendar in the next 90 days.</p></Panel>
      <Panel title="Projects & tasks" action={<a className="vy-panel-link" href="#/projects">All projects <ArrowRight size={15} /></a>}>{dataReady ? taskContent : <p className="vy-empty">{preview ? 'Task data is not connected in this preview.' : 'Task data is temporarily unavailable.'}</p>}{writable && <button className="vy-button vy-button-small vy-panel-bottom" type="button" onClick={onNewTask}><Plus size={14} /> Add a task</button>}</Panel>
      <Panel title="Locations we look after"><p className="vy-empty">Location records will be connected in a later migration phase.</p></Panel>
      <Panel title="Files & links" action={<ReferenceButton><Plus size={14} /> Add a link</ReferenceButton>}><p className="vy-empty">No links pinned for this department yet.</p></Panel>
      <Panel title="Team notes">{dataReady ? updateContent : <p className="vy-empty">{preview ? 'Team notes are not connected in this preview.' : 'Team notes are temporarily unavailable.'}</p>}</Panel>
    </div><div className="vy-stack"><section className="vy-folder-panel" style={codeStyle(department.color)}><div className="vy-folder-panel-head"><h2><DepartmentIcon code={department.code} size={23} /> {department.name}</h2><ReferenceButton><Plus size={14} /> Add</ReferenceButton></div><h3>Google Drive</h3>{department.folders.length ? <div className="vy-folder-list">{department.folders.map((folder) => <div key={folder}><Folder size={15} fill="#c79a73" strokeWidth={1.5} />{folder}</div>)}</div> : <p className="vy-empty">No folders set up yet.</p>}<h3>Shared here by the team</h3><p className="vy-empty">No shared files yet.</p></section>
      <Panel title="Shared records"><p className="vy-empty">Build-Out and I&M records will be available after migration.</p></Panel>
      <Panel title="Decisions this team makes" action={<a className="vy-panel-link" href="#/decisions">Full chart <ArrowRight size={15} /></a>}><p className="vy-empty">No decisions written down for this team yet.</p></Panel>
      <Panel title="What this team owns" action={<a className="vy-panel-link" href="#/ask">Who to ask <ArrowRight size={15} /></a>}><p className="vy-empty">Team ownership records will be added later.</p></Panel>
      <div className="vy-access-note">{role} access · {department.name}</div>
    </div></div>
  </>
}

export function WorkspacePlaceholder({ page }: { page: string }) {
  const item = referenceNav.find((entry) => entry.key === page)
  return <><header className="vy-hero vy-placeholder-hero"><div><h1><SectionIcon name={item?.key || page} size={32} /> {item?.label || page}</h1><p>This screen is next in the page-by-page React rebuild.</p></div><a className="vy-button" href="#/">Back to dashboard <ArrowRight size={15} /></a></header><div className="vy-placeholder-body"><h2>Design conversion in progress</h2><p>The original HQ prototype has this screen, but its data and controls have not been migrated into the React app. There are no editable controls on this screen yet.</p></div></>
}
