import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowRight, Bell, Check, CircleCheck, Eye, EyeOff, Hand, Plus, X,
} from 'lucide-react'
import { DEPARTMENTS, departmentByCode, type Department } from './departments'
import {
  canChangeTask, canWriteDepartment, createTask, departmentRole, listDepartmentPeople,
  loadAccess, loadHqData, postUpdate, setTaskStatus as saveTaskStatus,
  type Access, type HqTask, type HqUpdate, type Person,
} from './lib/data'
import { isConfigured, requireSupabase, supabase } from './lib/supabase'
import { WorkspaceDashboard, WorkspaceDepartment, WorkspacePlaceholder, WorkspaceShell } from './vy/Workspace'
import { companyDepartment, referenceByCode, referenceDepartments, referenceForDepartment } from './vy/reference'
import type { CalendarDraft } from './vy/calendar-model'
import { SunnyCharacter } from './vy/SunnyCharacter'

const CalendarWorkspace = lazy(() => import('./vy/CalendarWorkspace'))

type Route = { page: string; code?: string }
type TaskScope = 'mine' | 'all'
type TaskStatus = 'open' | 'done' | 'all'

function currentRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (path[0] === 'department' && path[1]) return { page: 'department', code: path[1] }
  return { page: path[0] || 'dashboard' }
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

function AuthFrame({ children }: { children: ReactNode }) {
  return <div className="auth-page">
    <main className="auth-panel">
      <div className="auth-sunny-row">
        <span className="auth-sunny" role="img" aria-label="Sunny, the Summerfield mascot, waving"><SunnyCharacter motion="greet" /></span>
        <span className="auth-bubble" aria-hidden="true">Hi! <Hand size={18} strokeWidth={1.8} /></span>
      </div>
      <div className="auth-wordmark">Summerfield</div>
      <div className="auth-tagline">TEA BAR · HQ</div>
      {children}
      <blockquote className="auth-quote"><strong>Leave it better than you found it.</strong><span>The station, the storeroom, the shift notes, the mood.</span></blockquote>
      <p className="auth-footnote">Your account and department access are managed by Summerfield.</p>
    </main>
  </div>
}

function SignIn({ onSignIn, onPreview, sessionError }: { onSignIn: (account: string, password: string) => Promise<void>; onPreview: () => void; sessionError: string }) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  return <AuthFrame>
      <div className="auth-heading"><h1>Welcome back</h1><p>Sign in with your Summerfield account.</p></div>
      {!isConfigured && <Notice>HQ needs its Supabase URL and publishable key before sign-in is available.</Notice>}
      {(error || sessionError) && <Notice>{error || sessionError}</Notice>}
      <form onSubmit={submit} className="auth-form">
        <label>Account<input autoComplete="username" autoCapitalize="none" spellCheck={false} value={account} onChange={(event) => setAccount(event.target.value)} required placeholder="Your account" /></label>
        <label>Password<span className="auth-password"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        <button className="button button-dark" disabled={busy || !isConfigured} type="submit">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
      {import.meta.env.DEV && <button className="auth-preview-button" type="button" onClick={onPreview}>Preview the HQ design <ArrowRight size={15} /></button>}
  </AuthFrame>
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

function DepartmentView({ access, department, tasks, updates, busyTaskId, onToggle, onNewTask, onPosted, dataReady }: {
  access: Access; department: Department; tasks: HqTask[]; updates: HqUpdate[];
  busyTaskId: string | null; onToggle: (task: HqTask) => void;
  onNewTask: () => void; onPosted: (update: HqUpdate) => void; dataReady: boolean
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

  return <WorkspaceDepartment
    department={referenceForDepartment(department)} role={access.organization.role === 'admin' ? 'Admin' : role === 'lead' ? 'Lead' : role === 'member' ? 'Member' : 'View'}
    myDepartment={localStorage.getItem('sfhq_my_department') === department.code}
    onSetMine={() => { localStorage.setItem('sfhq_my_department', department.code); window.dispatchEvent(new Event('sfhq-my-department')) }}
    dataReady={dataReady} writable={writable && dataReady} onNewTask={onNewTask}
    taskContent={<TaskList tasks={departmentTasks} access={access} onToggle={onToggle} busyId={busyTaskId} empty="No tasks here yet." />}
    updateContent={<>{writable && dataReady && <form className="update-compose" onSubmit={submit}><label className="sr-only" htmlFor="update-body">Write a department update</label><textarea id="update-body" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="Share progress, a blocker, or a decision…" required /><div className="compose-foot"><span>{body.length}/2000</span><button className="button button-small button-dark" disabled={posting || !body.trim()} type="submit">{posting ? 'Posting…' : 'Post update'}</button></div>{error && <Notice>{error}</Notice>}</form>}<UpdateList updates={departmentUpdates} empty="No updates yet." /></>}
  />
}

const previewAccess: Access = {
  userId: 'design-preview', displayName: 'Preview', email: '',
  organization: { organization_id: 'design-preview', organization_name: 'Summerfield', organization_slug: 'summerfield', role: 'viewer' },
  organizations: [], assignments: [],
  departments: [
    ...DEPARTMENTS,
    { code: 'it', name: 'IT', shortName: 'IT', description: 'Systems, POS, devices and access' },
    { code: 'hr', name: 'HR', shortName: 'HR', description: 'People, hiring and policies' },
  ],
}

function PreviewWorkspace({ route, onExit }: { route: Route; onExit: () => void }) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarDraft[]>([])
  const department = route.code === 'company' ? companyDepartment : route.code ? referenceByCode(route.code) : undefined
  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <WorkspaceDashboard access={previewAccess} tasks={[]} updates={[]} preview dataReady={false} taskContent={null} updateContent={null} />
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarWorkspace departments={[companyDepartment, ...referenceDepartments]} preview events={calendarEvents} onChange={setCalendarEvents} /></Suspense>
  } else if (route.page === 'department' && department) {
    content = <WorkspaceDepartment department={department} role="Preview" myDepartment={localStorage.getItem('sfhq_my_department') === department.code}
      onSetMine={() => { localStorage.setItem('sfhq_my_department', department.code); window.dispatchEvent(new Event('sfhq-my-department')) }}
      taskContent={null} updateContent={null} onNewTask={() => {}} writable={false} dataReady={false} />
  } else if (route.page === 'department') {
    content = <WorkspacePlaceholder page="Departments" />
  } else {
    content = <WorkspacePlaceholder page={route.page} />
  }
  return <WorkspaceShell access={previewAccess} route={route} preview refreshing={false} onRefresh={() => {}} onOrganization={() => {}} onSignOut={() => {}} onExitPreview={onExit}>{content}</WorkspaceShell>
}

export default function App() {
  const route = useRoute()
  const [preview, setPreview] = useState(false)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [access, setAccess] = useState<Access | null>(null)
  const [accessError, setAccessError] = useState('')
  const [tasks, setTasks] = useState<HqTask[]>([])
  const [updates, setUpdates] = useState<HqUpdate[]>([])
  const [dataError, setDataError] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [dataReady, setDataReady] = useState(false)
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
    }).catch((cause) => { if (mounted) { setSession(null); setAccessError(errorText(cause)) } })
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
    setDataReady(false)
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
        setTasks(result.tasks); setUpdates(result.updates); setDataReady(true)
      }
    } catch (cause) {
      if (currentOrganization.current === requestedOrganization) { setDataError(errorText(cause)); setDataReady(false) }
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
    setSession(null); setAccess(null); setPreview(false)
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
  const department = route.code ? access?.departments.find((item) => item.code === route.code) : undefined

  if (session === undefined) return <AuthFrame><div className="auth-heading" role="status"><h1>Just a moment...</h1><p>Checking your access.</p></div></AuthFrame>
  if (preview && (session || import.meta.env.DEV)) return <PreviewWorkspace route={route} onExit={() => setPreview(false)} />
  if (!session) return <SignIn onSignIn={signIn} onPreview={() => setPreview(true)} sessionError={accessError} />
  if (!access) return <AuthFrame>{accessError ? <div className="auth-access-state"><h1>We couldn't open your workspace</h1><Notice>{accessError}</Notice><button className="button button-dark" type="button" onClick={signOut}>Sign out</button>{import.meta.env.DEV && <button className="auth-preview-button" type="button" onClick={() => setPreview(true)}>Preview the HQ design <ArrowRight size={15} /></button>}</div> : <div className="auth-heading" role="status"><h1>Just a moment...</h1><p>Checking your department access.</p></div>}</AuthFrame>

  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <WorkspaceDashboard access={access} tasks={tasks} updates={updates} preview={false} dataReady={dataReady}
      taskContent={<TaskList tasks={myOpenTasks.slice(0, 6)} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="Nothing is assigned to you right now." />}
      updateContent={<UpdateList updates={updates.slice(0, 5)} empty="No team updates yet." />} />
  } else if (route.page === 'department') {
    content = department
      ? <DepartmentView key={department.code} access={access} department={department} tasks={tasks} updates={updates} busyTaskId={busyTaskId} dataReady={dataReady} onToggle={toggleTask} onNewTask={() => setTaskDepartment(department)} onPosted={(update) => { if (currentOrganization.current === update.organization_id) { setUpdates((list) => [update, ...list]); setToast('Update posted.') } }} />
      : <div className="empty-page"><h1>Department unavailable</h1><p>This department is not assigned to your account.</p><a className="button" href="#/departments">View your departments</a></div>
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarWorkspace departments={access.departments.map(referenceForDepartment)} preview={false} /></Suspense>
  } else if (route.page === 'departments') {
    content = <><div className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Departments</h1><p>Open a team space to see its tasks and updates.</p></div></div><div className="department-grid full-grid">{access.departments.map((item, index) => <a className={`department-tile tint-${index % 5}`} href={deptHref(item.code)} key={item.code}><div><span className="department-monogram">{initials(item.shortName)}</span><ArrowRight size={17} /></div><strong>{item.name}</strong><p>{item.description}</p><small>{departmentRole(access, item.code)} access · {tasks.filter((task) => task.department_code === item.code && task.status === 'open').length} open tasks</small></a>)}</div>{!access.departments.length && <div className="empty-state"><p>No departments have been assigned to this account.</p></div>}</>
  } else if (route.page === 'tasks') {
    const visible = sortedTasks.filter((task) => (taskScope === 'all' || task.assigned_to === access.userId) && (taskStatus === 'all' || task.status === taskStatus))
    content = <><div className="page-heading"><div><p className="eyebrow">Work</p><h1>Tasks</h1><p>Track what is due across the departments you can access.</p></div></div><section className="section list-page"><div className="filter-row"><div className="segmented" role="group" aria-label="Task scope"><button type="button" className={taskScope === 'mine' ? 'selected' : ''} onClick={() => setTaskScope('mine')}>Assigned to me</button><button type="button" className={taskScope === 'all' ? 'selected' : ''} onClick={() => setTaskScope('all')}>All visible</button></div><label className="status-filter">Status <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}><option value="open">Open</option><option value="done">Completed</option><option value="all">All</option></select></label></div><TaskList tasks={visible} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="No tasks match these filters." /></section></>
  } else if (route.page === 'updates') {
    content = <><div className="page-heading"><div><p className="eyebrow">From the team</p><h1>Updates</h1><p>Progress and decisions from the departments you can access.</p></div></div><section className="section list-page"><UpdateList updates={updates} empty="No updates have been posted yet." /></section></>
  } else {
    content = <WorkspacePlaceholder page={route.page} />
  }

  return <WorkspaceShell access={access} route={route} preview={false} onRefresh={() => void refresh()} refreshing={loadingData} onOrganization={changeOrganization} onSignOut={() => void signOut()} onExitPreview={() => {}} onEnterPreview={import.meta.env.DEV || access.organization.role === 'admin' ? () => setPreview(true) : undefined}>
    {dataError && !['dashboard', 'department'].includes(route.page) && <Notice>HQ data could not be loaded: {dataError}</Notice>}
    {content}
    {taskDepartment && <TaskDialog access={access} department={taskDepartment} onClose={() => setTaskDepartment(null)} onCreated={(task) => { if (currentOrganization.current === task.organization_id) { setTasks((list) => [task, ...list]); setToast('Task created.') } }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </WorkspaceShell>
}
