import { useEffect, useState, type ReactNode } from 'react'
import { Bell, LogOut, RefreshCw, Search, X } from 'lucide-react'
import { companyDepartment, referenceDepartments, referenceForDepartment, referenceHref, referenceNav, sortLikeReference } from '@/shared/config/reference-departments'
import { useMyDepartment } from '@/shared/lib/my-department'
import type { Route } from '@/shared/lib/routing'
import { DepartmentIcon, SectionIcon } from '@/shared/ui/icons'
import { SelectField } from '@/shared/ui/SelectField'
import { departmentRole, type Access } from '@/features/auth'
import { reportsHref, useCurrentReportPeriod } from '@/features/reports'
import { SunnyPet } from '@/features/sunny'
// Styles for everything drawn inside the shell (Vy's HQ design), including the dashboard and department pages.
import './workspace.css'

type Layout = 'auto' | 'phone' | 'desktop'

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
  const [myDepartment, selectMine] = useMyDepartment()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const currentReportMonth = useCurrentReportPeriod('monthly')
  useEffect(() => { setMoreOpen(false); setSearchOpen(false); window.scrollTo(0, 0) }, [route.page, route.code])
  const visibleDepartments = preview ? [companyDepartment, ...referenceDepartments] : sortLikeReference(access.departments.map(referenceForDepartment))
  const visibleSections = referenceNav.filter((item) => item.key !== 'people' || access.organization.role === 'admin' || preview)
  // The preview retains its legacy route; signed-in navigation opens the live report board.
  const sectionHref = (key: string, href: string) => key === 'reports' && !preview ? reportsHref(currentReportMonth) : href
  const selected = route.page === 'department' ? route.code : route.page === 'project' || route.page === 'tickets' ? 'projects' : route.page === 'lesson' ? 'learn' : route.page === 'report' ? 'reports' : route.page
  const mobile = layout === 'phone'
  const departmentOptions = visibleDepartments.filter((item) => item.code !== 'company')
  const myDepartmentOptions = [{ value: '', label: 'Choose…' }, ...departmentOptions.map((item) => ({ value: item.code, label: item.name }))]
  const selectedDepartment = departmentOptions.some((item) => item.code === myDepartment) ? myDepartment : ''

  return <div className={`vy-shell ${mobile ? 'vy-force-phone' : ''} ${layout === 'desktop' ? 'vy-force-desktop' : ''}`}>
    <aside className="vy-rail" aria-label="Summerfield HQ">
      <a className="vy-mark" href="#/"><strong>Summerfield</strong><span>TEA BAR · HQ</span></a>
      <nav className="vy-rail-nav" aria-label="Main navigation">{visibleSections.map((item) => <a key={item.key} className={selected === item.key ? 'is-active' : ''} aria-current={selected === item.key ? 'page' : undefined} href={sectionHref(item.key, item.href)}><span className="vy-nav-icon"><SectionIcon name={item.key} /></span>{item.label}</a>)}</nav>
      <div className="vy-rail-heading">Departments</div>
      <nav className="vy-rail-nav vy-department-nav" aria-label="Departments">
        {visibleDepartments.map((item) => <a key={item.code} className={selected === item.code ? 'is-active' : ''} aria-current={selected === item.code ? 'page' : undefined} title={preview ? undefined : `${item.name}: ${access.organization.role === 'admin' ? 'admin' : departmentRole(access, item.code)} access`} href={referenceHref(item.code)}><span className="vy-nav-icon"><DepartmentIcon code={item.code} /></span>{item.name}</a>)}
      </nav>
      <div className="vy-rail-foot">
        <label>My department<SelectField value={selectedDepartment} onChange={selectMine} options={myDepartmentOptions} size="compact" /></label>
        <div className="vy-rail-view-label">View</div><LayoutPicker layout={layout} onChange={setLayout} />
        <div className="vy-rail-account"><span>{access.displayName}<small>{preview ? 'Design preview' : `${access.organization.organization_name} · ${access.organization.role}`}</small></span>{preview ? <button type="button" onClick={onExitPreview}>Exit preview</button> : <button type="button" onClick={onSignOut}><LogOut size={14} /> Sign out</button>}</div>
      </div>
    </aside>
    <div className="vy-body">
      <header className="vy-topbar">
        <a href="#/" className="vy-topbar-brand">Summerfield HQ</a>
        <div className="vy-topbar-right"><LayoutPicker layout={layout} onChange={setLayout} /><label className="vy-topbar-dept"><span className="sr-only">My department</span><SelectField ariaLabel="My department" value={selectedDepartment} onChange={selectMine} options={myDepartmentOptions} size="compact" /></label></div>
      </header>
      <div className="vy-utility"><span>{preview ? 'Design preview · changes are not saved' : `${access.organization.organization_name} · ${access.displayName}`}</span><div>{onEnterPreview && <button className="vy-preview-switch" type="button" onClick={onEnterPreview}>Design preview</button>}<button type="button" className="vy-icon-button" aria-label="Refresh HQ data" title="Refresh HQ data" onClick={onRefresh} disabled={preview || refreshing}><RefreshCw size={17} className={refreshing ? 'spinning' : ''} /></button><button type="button" className="vy-icon-button" aria-label="Notifications" title="Notifications" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={17} /></button>{!preview && access.organizations.length > 1 && <label className="vy-org"><span className="sr-only">Organization</span><SelectField ariaLabel="Organization" value={access.organization.organization_id} onChange={onOrganization} options={access.organizations.map((item) => ({ value: item.organization_id, label: item.organization_name }))} size="compact" /></label>}</div></div>
      {notificationOpen && <div className="vy-notification" role="status">Notifications will appear here after that workflow is connected.<button type="button" aria-label="Close notifications" onClick={() => setNotificationOpen(false)}><X size={15} /></button></div>}
      <main className="vy-main" id="main-content">{children}</main>
    </div>
    <SunnyPet layout={layout} />
    <nav className="vy-mobile-tabs" aria-label="Sections"><a href="#/" className={selected === 'dashboard' ? 'is-active' : ''}><SectionIcon name="dashboard" size={20} />Dashboard</a><a href="#/calendar" className={selected === 'calendar' ? 'is-active' : ''}><SectionIcon name="calendar" size={20} />Calendar</a><a href="#/tasks" className={selected === 'tasks' ? 'is-active' : ''}><SectionIcon name="tasks" size={20} />Tasks</a><button type="button" onClick={() => setSearchOpen(true)}><SectionIcon name="search" size={20} />Search</button><button type="button" onClick={() => setMoreOpen(true)}><SectionIcon name="more" size={20} />More</button></nav>
    {(moreOpen || searchOpen) && <div className="vy-sheet-scrim" onClick={() => { setMoreOpen(false); setSearchOpen(false) }}><div className="vy-sheet" role="dialog" aria-modal="true" aria-label={searchOpen ? 'Search HQ sections' : 'More sections'} onClick={(event) => event.stopPropagation()}><div className="vy-sheet-head"><h2>{searchOpen ? 'Search HQ' : 'More'}</h2><button type="button" className="vy-icon-button" aria-label="Close" onClick={() => { setMoreOpen(false); setSearchOpen(false) }}><X size={18} /></button></div>{searchOpen && <label className="vy-search-field"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a section or department" /></label>}<div className="vy-sheet-links">{visibleSections.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).map((item) => <a key={item.key} href={sectionHref(item.key, item.href)}><SectionIcon name={item.key} />{item.label}</a>)}{visibleDepartments.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => <a key={item.code} href={referenceHref(item.code)}><DepartmentIcon code={item.code} />{item.name}</a>)}</div><div className="vy-sheet-account">{access.displayName} · {preview ? <button type="button" onClick={onExitPreview}>Exit preview</button> : <><button type="button" onClick={onEnterPreview}>Design preview</button><button type="button" onClick={onSignOut}>Sign out</button></>}</div></div></div>}
  </div>
}
