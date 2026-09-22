import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleCheck,
  ClipboardList, LogOut, Menu, Plus, RefreshCw, Search, X,
} from 'lucide-react'
import { departmentByCode, type Department } from './departments'
import {
  canChangeTask, canWriteDepartment, createTask, departmentRole, listDepartmentPeople,
  loadAccess, loadHqData, postUpdate, setTaskStatus as saveTaskStatus,
  type Access, type HqTask, type HqUpdate, type Person,
} from './lib/data'
import { isConfigured, requireSupabase, supabase } from './lib/supabase'

type Route = { page: 'dashboard' | 'tasks' | 'updates' | 'departments' | 'department'; code?: string }
type TaskScope = 'mine' | 'all'
type TaskStatus = 'open' | 'done' | 'all'

function currentRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (path[0] === 'department' && path[1]) return { page: 'department', code: path[1] }
  if (path[0] === 'tasks' || path[0] === 'updates' || path[0] === 'departments') {
    return { page: path[0] }
  }
  return { page: 'dashboard' }
}

function useRoute() {
  const [route, setRoute] = useState<Route>(currentRoute)
  useEffect(() => {
    const update = () => { setRoute(currentRoute()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route
}

const deptHref = (code: string) => `#/department/${code}`

function displayDate(value: string | null, withYear = false) {
  if (!value) return 'No due date'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
    : new Date(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })
}

function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return displayDate(value, true)
}

function todayLocal() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase()
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function compareTasks(a: HqTask, b: HqTask) {
  if (a.status !== b.status) return a.status === 'open' ? -1 : 1
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
  if (a.due_date) return -1
  if (b.due_date) return 1
  return b.created_at.localeCompare(a.created_at)
}

function Notice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' | 'success' }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}

function SignIn({ onSignIn }: { onSignIn: (account: string, password: string) => Promise<void> }) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try { await onSignIn(account.trim().toLowerCase(), password) }
    catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  return <div className="auth-page">
    <div className="auth-brand"><img src="/summerfield-logo-wordmark.svg" alt="Summerfield" /><span>HQ</span></div>
    <main className="auth-panel">
      <div className="auth-rule" aria-hidden="true" />
      <p className="eyebrow">Summerfield HQ</p>
      <h1>Welcome back</h1>
      <p className="muted">Sign in with your assigned Summerfield account.</p>
      {!isConfigured && <Notice>HQ needs its Supabase URL and publishable key before sign-in is available.</Notice>}
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="auth-form">
        <label>Account<input autoComplete="username" value={account} onChange={(event) => setAccount(event.target.value)} required placeholder="Your account or email" /></label>
        <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="button button-dark" disabled={busy || !isConfigured} type="submit">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
    </main>
    <div className="auth-footer">Tasks and updates for your Summerfield teams</div>
  </div>
}

function TaskList({ tasks, access, onToggle, busyId, empty }: {
  tasks: HqTask[]; access: Access; onToggle: (task: HqTask) => void;
  busyId: string | null; empty: string
}) {
  if (!tasks.length) return <div className="empty-state"><CircleCheck size={22} /><p>{empty}</p></div>
  return <div className="task-list">
    {tasks.map((task) => {
      const allowed = canChangeTask(access, task)
      const overdue = task.status === 'open' && Boolean(task.due_date && task.due_date < todayLocal())
      return <div className={`task-row ${task.status === 'done' ? 'task-done' : ''}`} key={task.id}>
        <button className="task-check" type="button" disabled={!allowed || busyId === task.id}
          onClick={() => onToggle(task)} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`}
          title={allowed ? (task.status === 'done' ? 'Reopen task' : 'Complete task') : 'Only the creator, assignee, or lead can update this task'}>
          {task.status === 'done' ? <Check size={16} strokeWidth={3} /> : null}
        </button>
        <div className="task-main">
          <div className="task-title">{task.title}</div>
          {task.details && <p>{task.details}</p>}
          <div className="row-meta"><a href={deptHref(task.department_code)}>{departmentByCode(task.department_code)?.shortName || task.department_code}</a><span className="meta-separator">·</span><span className={overdue ? 'overdue' : ''}>{task.due_date ? `Due ${displayDate(task.due_date)}` : 'No due date'}</span>{task.assigned_to === access.userId && <span className="assigned-pill">Assigned to you</span>}</div>
        </div>
      </div>
    })}
  </div>
}

function UpdateList({ updates, empty }: { updates: HqUpdate[]; empty: string }) {
  if (!updates.length) return <div className="empty-state"><Bell size={22} /><p>{empty}</p></div>
  return <div className="update-list">{updates.map((update) => <article className="update-item" key={update.id}>
    <span className="avatar" aria-hidden="true">{initials(update.author_name)}</span>
    <div><div className="update-meta"><strong>{update.author_name}</strong><span>·</span><a href={deptHref(update.department_code)}>{departmentByCode(update.department_code)?.shortName || update.department_code}</a><span>·</span><time dateTime={update.created_at}>{relativeTime(update.created_at)}</time></div><p>{update.body}</p></div>
  </article>)}</div>
}

function TaskDialog({ access, department, onClose, onCreated }: {
  access: Access; department: Department; onClose: () => void; onCreated: (task: HqTask) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    listDepartmentPeople(access.organization.organization_id, department.code)
      .then(setPeople).catch((cause) => setError(`Could not load teammates: ${errorText(cause)}`))
    return () => element?.close()
  }, [access.organization.organization_id, department.code])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true); setError('')
    try {
      const task = await createTask({
        access, departmentCode: department.code, title, details,
        dueDate: dueDate || null, assignedTo: assignedTo || null,
      })
      onCreated(task)
      onClose()
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  return <dialog ref={dialog} className="dialog" onClose={onClose} onCancel={onClose} aria-labelledby="task-dialog-title">
    <div className="dialog-head"><div><p className="eyebrow">{department.name}</p><h2 id="task-dialog-title">New task</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
    <form onSubmit={submit} className="dialog-form">
      {error && <Notice>{error}</Notice>}
      <label>Task<input autoFocus maxLength={140} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" /></label>
      <label>Details <span className="optional">Optional</span><textarea maxLength={4000} rows={4} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add the context someone needs to finish this" /></label>
      <div className="form-grid"><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label>Assign to<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Unassigned</option>{people.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name}</option>)}</select></label></div>
      <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy} type="submit">{busy ? 'Saving…' : 'Create task'}</button></div>
    </form>
  </dialog>
}

function DepartmentView({ access, department, tasks, updates, busyTaskId, onToggle, onNewTask, onPosted }: {
  access: Access; department: Department; tasks: HqTask[]; updates: HqUpdate[];
  busyTaskId: string | null; onToggle: (task: HqTask) => void;
  onNewTask: () => void; onPosted: (update: HqUpdate) => void
}) {
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const role = departmentRole(access, department.code)
  const writable = canWriteDepartment(access, department.code)
  const departmentTasks = tasks.filter((task) => task.department_code === department.code).sort(compareTasks)
  const departmentUpdates = updates.filter((update) => update.department_code === department.code)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    setPosting(true); setError('')
    try {
      const update = await postUpdate(access, department.code, body)
      onPosted(update)
      setBody('')
    } catch (cause) { setError(errorText(cause)) }
    finally { setPosting(false) }
  }

  return <>
    <div className="page-heading department-heading"><div><a className="back-link" href="#/departments">Departments</a><h1>{department.name}</h1><p>{department.description}</p></div><span className="access-badge">{role === 'lead' ? 'Lead access' : role === 'member' ? 'Member access' : 'View access'}</span></div>
    <div className="department-summary"><div><b>{departmentTasks.filter((task) => task.status === 'open').length}</b><span>Open tasks</span></div><div><b>{departmentTasks.filter((task) => task.status === 'done').length}</b><span>Completed tasks</span></div><div><b>{departmentUpdates.length}</b><span>Updates</span></div></div>
    <div className="content-columns">
      <section className="section"><div className="section-head"><div><h2>Tasks</h2><p>Work owned by this department</p></div>{writable && <button className="button button-small button-dark" type="button" onClick={onNewTask}><Plus size={16} /> New task</button>}</div><TaskList tasks={departmentTasks} access={access} onToggle={onToggle} busyId={busyTaskId} empty="No tasks here yet." /></section>
      <section className="section"><div className="section-head"><div><h2>Team updates</h2><p>Notes from the people doing the work</p></div></div>{writable && <form className="update-compose" onSubmit={submit}><label className="sr-only" htmlFor="update-body">Write a department update</label><textarea id="update-body" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="Share progress, a blocker, or a decision…" required /><div className="compose-foot"><span>{body.length}/2000</span><button className="button button-small button-dark" disabled={posting || !body.trim()} type="submit">{posting ? 'Posting…' : 'Post update'}</button></div>{error && <Notice>{error}</Notice>}</form>}<UpdateList updates={departmentUpdates} empty="No updates yet." /></section>
    </div>
  </>
}

function Shell({ access, route, children, onRefresh, refreshing, onOrganization, onSignOut }: {
  access: Access; route: Route; children: ReactNode; onRefresh: () => void;
  refreshing: boolean; onOrganization: (id: string) => void; onSignOut: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [route.page, route.code])
  const section = route.page === 'department' ? route.code : route.page
  const nav = [
    { label: 'Dashboard', href: '#/', key: 'dashboard', icon: <ClipboardList size={18} /> },
    { label: 'Tasks', href: '#/tasks', key: 'tasks', icon: <CircleCheck size={18} /> },
    { label: 'Updates', href: '#/updates', key: 'updates', icon: <Bell size={18} /> },
    { label: 'Departments', href: '#/departments', key: 'departments', icon: <Search size={18} /> },
  ]
  return <div className="app-shell">
    <button className={`mobile-scrim ${menuOpen ? 'is-open' : ''}`} aria-label="Close menu" type="button" onClick={() => setMenuOpen(false)} />
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
      <a className="sidebar-brand" href="#/"><img src="/summerfield-logo-wordmark.svg" alt="Summerfield" /><span>HQ</span></a>
      <nav className="primary-nav" aria-label="Primary">{nav.map((item) => <a className={route.page === item.key ? 'active' : ''} aria-current={route.page === item.key ? 'page' : undefined} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></a>)}</nav>
      <div className="nav-divider" />
      <div className="nav-label">YOUR DEPARTMENTS</div>
      <nav className="department-nav" aria-label="Departments">{access.departments.map((department) => <a href={deptHref(department.code)} className={section === department.code ? 'active' : ''} aria-current={section === department.code ? 'page' : undefined} key={department.code}><span className="nav-dot" /><span>{department.shortName}</span></a>)}{!access.departments.length && <span className="nav-empty">No departments assigned</span>}</nav>
      <div className="sidebar-user"><span className="avatar avatar-dark">{initials(access.displayName)}</span><div><strong>{access.displayName}</strong><span>{access.organization.role === 'admin' ? 'Company admin' : 'Team member'}</span></div><button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={onSignOut}><LogOut size={17} /></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><button className="icon-button menu-button" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></button><div className="topbar-title">Summerfield <span>/</span> HQ</div><div className="topbar-actions">{access.organizations.length > 1 && <label className="org-picker"><span className="sr-only">Organization</span><select value={access.organization.organization_id} onChange={(event) => onOrganization(event.target.value)}>{access.organizations.map((organization) => <option value={organization.organization_id} key={organization.organization_id}>{organization.organization_name}</option>)}</select></label>}<button className="icon-button" aria-label="Refresh HQ data" title="Refresh HQ data" type="button" disabled={refreshing} onClick={onRefresh}><RefreshCw size={18} className={refreshing ? 'spinning' : ''} /></button><span className="topbar-person">{access.displayName}</span></div></header>
      <main className="main-content" id="main-content">{children}</main>
    </div>
  </div>
}

export default function App() {
  const route = useRoute()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [access, setAccess] = useState<Access | null>(null)
  const [accessError, setAccessError] = useState('')
  const [tasks, setTasks] = useState<HqTask[]>([])
  const [updates, setUpdates] = useState<HqUpdate[]>([])
  const [dataError, setDataError] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [taskDepartment, setTaskDepartment] = useState<Department | null>(null)
  const [taskScope, setTaskScope] = useState<TaskScope>('mine')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('open')
  const [organizationId, setOrganizationId] = useState(() => localStorage.getItem('sfhq_organization') || '')
  const [toast, setToast] = useState('')
  const currentOrganization = useRef<string | null>(null)
  currentOrganization.current = access?.organization.organization_id || null

  useEffect(() => {
    if (!supabase) { setSession(null); return }
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) { setSession(data.session); if (error) setAccessError(error.message) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session) { setAccess(null); setTasks([]); setUpdates([]); return }
    let active = true
    setAccessError('')
    setAccess(null)
    setTasks([])
    setUpdates([])
    setTaskDepartment(null)
    setBusyTaskId(null)
    setLoadingData(false)
    setDataError('')
    loadAccess(session, organizationId).then((next) => {
      if (active) {
        setAccess(next)
        localStorage.setItem('sfhq_organization', next.organization.organization_id)
      }
    }).catch((cause) => { if (active) setAccessError(errorText(cause)) })
    return () => { active = false }
  }, [session?.user.id, organizationId])

  const refresh = useCallback(async () => {
    if (!access) return
    const requestedOrganization = access.organization.organization_id
    setLoadingData(true); setDataError('')
    try {
      const result = await loadHqData(requestedOrganization)
      if (currentOrganization.current === requestedOrganization) {
        setTasks(result.tasks); setUpdates(result.updates)
      }
    } catch (cause) {
      if (currentOrganization.current === requestedOrganization) setDataError(errorText(cause))
    } finally {
      if (currentOrganization.current === requestedOrganization) setLoadingData(false)
    }
  }, [access])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!access) return
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(onVisible, 60_000)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer) }
  }, [access, refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function signIn(account: string, password: string) {
    const { error } = await requireSupabase().auth.signInWithPassword({ email: account, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    const { error } = await requireSupabase().auth.signOut()
    if (error) { setToast(error.message); return }
    setSession(null); setAccess(null)
  }

  async function toggleTask(task: HqTask) {
    if (!access || busyTaskId) return
    setBusyTaskId(task.id)
    try {
      const changed = await saveTaskStatus(access, task, task.status === 'open' ? 'done' : 'open')
      if (currentOrganization.current === changed.organization_id) {
        setTasks((list) => list.map((item) => item.id === changed.id ? changed : item))
        setToast(changed.status === 'done' ? 'Task completed.' : 'Task reopened.')
      }
    } catch (cause) {
      if (currentOrganization.current === access.organization.organization_id) {
        setToast(errorText(cause)); void refresh()
      }
    }
    finally { setBusyTaskId(null) }
  }

  function changeOrganization(id: string) {
    localStorage.setItem('sfhq_organization', id)
    setOrganizationId(id)
    window.location.hash = '#/'
  }

  const sortedTasks = useMemo(() => [...tasks].sort(compareTasks), [tasks])
  const myOpenTasks = sortedTasks.filter((task) => task.status === 'open' && task.assigned_to === access?.userId)
  const openCount = tasks.filter((task) => task.status === 'open').length
  const overdueCount = tasks.filter((task) => task.status === 'open' && task.due_date && task.due_date < todayLocal()).length
  const department = route.code ? access?.departments.find((item) => item.code === route.code) : undefined

  if (session === undefined) return <div className="boot-loading">Opening Summerfield HQ…</div>
  if (!session) return <SignIn onSignIn={signIn} />
  if (!access) return <div className="access-screen"><img src="/summerfield-logo-wordmark.svg" alt="Summerfield" />{accessError ? <><Notice>{accessError}</Notice><button className="button" type="button" onClick={signOut}>Sign out</button></> : <p>Loading your access…</p>}</div>

  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <>
      <section className="welcome-band"><p className="eyebrow">{access.organization.organization_name}</p><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {access.displayName.split(' ')[0]}</h1><p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Your teams and their work in one place.</p><div className="welcome-actions"><a className="button button-light" href="#/tasks">View tasks <ArrowRight size={16} /></a><a className="button button-outline-light" href="#/departments">Departments</a></div></section>
      <div className="stats-band"><div><strong>{access.departments.length}</strong><span>Departments</span></div><div><strong>{openCount}</strong><span>Open tasks</span></div><div><strong>{myOpenTasks.length}</strong><span>Assigned to you</span></div><div><strong>{overdueCount}</strong><span>Overdue</span></div></div>
      <div className="content-columns dashboard-columns"><section className="section"><div className="section-head"><div><h2>Your next tasks</h2><p>Work assigned to you</p></div><a className="text-link" href="#/tasks">All tasks <ChevronRight size={15} /></a></div><TaskList tasks={myOpenTasks.slice(0, 6)} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="Nothing is assigned to you right now." /></section><section className="section"><div className="section-head"><div><h2>Latest updates</h2><p>From your departments</p></div><a className="text-link" href="#/updates">All updates <ChevronRight size={15} /></a></div><UpdateList updates={updates.slice(0, 5)} empty="No team updates yet." /></section></div>
      <section className="section department-section"><div className="section-head"><div><h2>Your departments</h2><p>Spaces you can open</p></div><a className="text-link" href="#/departments">See all <ChevronRight size={15} /></a></div><div className="department-grid">{access.departments.map((item, index) => <a className={`department-tile tint-${index % 5}`} href={deptHref(item.code)} key={item.code}><div><span className="department-monogram">{initials(item.shortName)}</span><ArrowRight size={17} /></div><strong>{item.name}</strong><p>{item.description}</p><small>{tasks.filter((task) => task.department_code === item.code && task.status === 'open').length} open tasks</small></a>)}</div>{!access.departments.length && <div className="empty-state"><p>No departments have been assigned to this account.</p></div>}</section>
    </>
  } else if (route.page === 'department') {
    content = department
      ? <DepartmentView key={department.code} access={access} department={department} tasks={tasks} updates={updates} busyTaskId={busyTaskId} onToggle={toggleTask} onNewTask={() => setTaskDepartment(department)} onPosted={(update) => { if (currentOrganization.current === update.organization_id) { setUpdates((list) => [update, ...list]); setToast('Update posted.') } }} />
      : <div className="empty-page"><h1>Department unavailable</h1><p>This department is not assigned to your account.</p><a className="button" href="#/departments">View your departments</a></div>
  } else if (route.page === 'departments') {
    content = <><div className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Departments</h1><p>Open a team space to see its tasks and updates.</p></div></div><div className="department-grid full-grid">{access.departments.map((item, index) => <a className={`department-tile tint-${index % 5}`} href={deptHref(item.code)} key={item.code}><div><span className="department-monogram">{initials(item.shortName)}</span><ArrowRight size={17} /></div><strong>{item.name}</strong><p>{item.description}</p><small>{departmentRole(access, item.code)} access · {tasks.filter((task) => task.department_code === item.code && task.status === 'open').length} open tasks</small></a>)}</div>{!access.departments.length && <div className="empty-state"><p>No departments have been assigned to this account.</p></div>}</>
  } else if (route.page === 'tasks') {
    const visible = sortedTasks.filter((task) => (taskScope === 'all' || task.assigned_to === access.userId) && (taskStatus === 'all' || task.status === taskStatus))
    content = <><div className="page-heading"><div><p className="eyebrow">Work</p><h1>Tasks</h1><p>Track what is due across the departments you can access.</p></div></div><section className="section list-page"><div className="filter-row"><div className="segmented" role="group" aria-label="Task scope"><button type="button" className={taskScope === 'mine' ? 'selected' : ''} onClick={() => setTaskScope('mine')}>Assigned to me</button><button type="button" className={taskScope === 'all' ? 'selected' : ''} onClick={() => setTaskScope('all')}>All visible</button></div><label className="status-filter">Status <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}><option value="open">Open</option><option value="done">Completed</option><option value="all">All</option></select></label></div><TaskList tasks={visible} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="No tasks match these filters." /></section></>
  } else {
    content = <><div className="page-heading"><div><p className="eyebrow">From the team</p><h1>Updates</h1><p>Progress and decisions from the departments you can access.</p></div></div><section className="section list-page"><UpdateList updates={updates} empty="No updates have been posted yet." /></section></>
  }

  return <Shell access={access} route={route} onRefresh={() => void refresh()} refreshing={loadingData} onOrganization={changeOrganization} onSignOut={() => void signOut()}>
    {dataError && <Notice>HQ data could not be loaded: {dataError}</Notice>}
    {content}
    {taskDepartment && <TaskDialog access={access} department={taskDepartment} onClose={() => setTaskDepartment(null)} onCreated={(task) => { if (currentOrganization.current === task.organization_id) { setTasks((list) => [task, ...list]); setToast('Task created.') } }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Shell>
}
