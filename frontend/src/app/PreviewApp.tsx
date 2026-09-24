import { Suspense, useState, type ReactNode } from 'react'
import { DEPARTMENTS } from '@/shared/config/departments'
import { companyDepartment, referenceByCode, referenceDepartments } from '@/shared/config/reference-departments'
import type { Route } from '@/shared/lib/routing'
import type { Access } from '@/features/auth'
import { CalendarPage, type CalendarDraft } from '@/features/calendar'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentLayout } from '@/features/departments'
import { DepartmentFoldersPage } from '@/features/folders'
import { HelpPage } from '@/features/help'
import { DecisionChartPage, previewAreas, previewDecisions, previewProfiles, WhoToAskPage, type ContactProfile, type DecisionRule, type OwnershipArea } from '@/features/ownership'
import { ProjectPage, ProjectsPage, previewProjectMessages, previewProjects, previewProjectTasks, type ProjectMessage, type ProjectRecord, type ProjectTask } from '@/features/projects'
import { MyTasksPage, TaskDetailsDialog, TaskDialog, type HqTask } from '@/features/tasks'
import { PlaceholderPage, WorkspaceShell } from '@/features/workspace'
import { WatchPage, type WatchItem } from '@/features/watch'
import { PREVIEW_USER, previewNames, previewPeople, previewTask, previewTasks } from './preview-data'

// Design preview: every screen with no company data and nothing saved.
const previewAccess: Access = {
  userId: PREVIEW_USER, displayName: 'Preview', email: '',
  organization: { organization_id: 'design-preview', organization_name: 'Summerfield', organization_slug: 'summerfield', role: 'viewer' },
  organizations: [], assignments: [],
  departments: [
    ...DEPARTMENTS,
    { code: 'it', name: 'IT', shortName: 'IT', description: 'Systems, POS, devices and access' },
    { code: 'hr', name: 'HR', shortName: 'HR', description: 'People, hiring and policies' },
  ],
}

// Stable, so the task dialog doesn't reload its people list on every render.
const loadPreviewPeople = async () => previewPeople

export function PreviewApp({ route, onExit }: { route: Route; onExit: () => void }) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarDraft[]>([])
  const [tasks, setTasks] = useState<HqTask[]>(previewTasks)
  const [watchItems, setWatchItems] = useState<WatchItem[]>([])
  const [areas, setAreas] = useState<OwnershipArea[]>(previewAreas)
  const [profiles, setProfiles] = useState<ContactProfile[]>(previewProfiles)
  const [decisions, setDecisions] = useState<DecisionRule[]>(previewDecisions)
  const [projects, setProjects] = useState<ProjectRecord[]>(previewProjects)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(previewProjectTasks)
  const [projectMessages, setProjectMessages] = useState<ProjectMessage[]>(previewProjectMessages)
  const [ticketManager, setTicketManager] = useState('')
  const [newTask, setNewTask] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const openTask = openTaskId ? tasks.find((task) => task.id === openTaskId) : undefined
  const toggle = (task: HqTask) => setTasks((list) => list.map((item) => item.id !== task.id ? item : {
    ...item, status: item.status === 'open' ? 'done' : 'open', completed_at: item.status === 'open' ? new Date().toISOString() : null, revision: item.revision + 1,
  }))
  const department = route.code === 'company' ? companyDepartment : route.code ? referenceByCode(route.code) : undefined
  const projectPeople = previewPeople.map((person) => ({ id: person.user_id, name: person.display_name }))
  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <DashboardPage access={previewAccess} tasks={[]} updates={[]} preview dataReady={false} taskContent={null} updateContent={null} />
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarPage departments={[companyDepartment, ...referenceDepartments]} preview events={calendarEvents} onChange={setCalendarEvents} /></Suspense>
  } else if (route.page === 'tasks') {
    content = <MyTasksPage access={previewAccess} tasks={tasks} dataReady preview names={previewNames} busyId={null}
      canCreate onNewTask={() => setNewTask(true)} onToggle={toggle} onOpen={(task) => setOpenTaskId(task.id)} />
  } else if (route.page === 'folders') {
    content = <DepartmentFoldersPage departments={referenceDepartments} dashboardCodes={['company', ...referenceDepartments.map((item) => item.code)]} />
  } else if (route.page === 'help') {
    content = <Suspense fallback={<p role="status">Loading guides...</p>}><HelpPage departments={previewAccess.departments} /></Suspense>
  } else if (route.page === 'watch') {
    content = <Suspense fallback={<p role="status">Loading Market watch...</p>}><WatchPage departments={[companyDepartment, ...referenceDepartments]} preview items={watchItems} onItemsChange={setWatchItems} /></Suspense>
  } else if (route.page === 'ask') {
    content = <Suspense fallback={<p role="status">Loading Who to ask...</p>}><WhoToAskPage departments={referenceDepartments} people={previewPeople.map((person) => ({ id: person.user_id, name: person.display_name }))} currentUser={PREVIEW_USER} areas={areas} profiles={profiles} preview onAreasChange={setAreas} onProfilesChange={setProfiles} /></Suspense>
  } else if (route.page === 'decisions') {
    content = <Suspense fallback={<p role="status">Loading Decision chart...</p>}><DecisionChartPage departments={referenceDepartments} people={previewPeople.map((person) => ({ id: person.user_id, name: person.display_name }))} currentUser={PREVIEW_USER} rules={decisions} preview onRulesChange={setDecisions} /></Suspense>
  } else if (route.page === 'projects') {
    content = <ProjectsPage departments={referenceDepartments} people={projectPeople} currentUser={PREVIEW_USER} projects={projects} tasks={projectTasks} preview ticketManager={ticketManager} onTicketManagerChange={setTicketManager} onProjectsChange={setProjects} onTasksChange={setProjectTasks} />
  } else if (route.page === 'project') {
    content = <ProjectPage id={route.code || ''} departments={referenceDepartments} people={projectPeople} currentUser={PREVIEW_USER} projects={projects} tasks={projectTasks} messages={projectMessages} preview onProjectsChange={setProjects} onTasksChange={setProjectTasks} onMessagesChange={setProjectMessages} />
  } else if (route.page === 'department' && department) {
    content = <DepartmentLayout department={department} role="Preview" taskContent={null} updateContent={null} onNewTask={() => {}} writable={false} dataReady={false} />
  } else if (route.page === 'department') {
    content = <PlaceholderPage page="Departments" />
  } else {
    content = <PlaceholderPage page={route.page} />
  }
  return <WorkspaceShell access={previewAccess} route={route} preview refreshing={false} onRefresh={() => {}} onOrganization={() => {}} onSignOut={() => {}} onExitPreview={onExit}>
    {content}
    {newTask && <TaskDialog access={previewAccess} departments={DEPARTMENTS} assignToMe onClose={() => setNewTask(false)}
      loadPeople={loadPreviewPeople}
      save={async (input) => previewTask({ title: input.title.trim(), details: input.details.trim(), department_code: input.departmentCode, due_date: input.dueDate, assigned_to: input.assignedTo })}
      onCreated={(task) => setTasks((list) => [task, ...list])} />}
    {openTask && <TaskDetailsDialog task={openTask} access={previewAccess} names={previewNames} busy={false} onToggle={toggle} onClose={() => setOpenTaskId(null)} />}
  </WorkspaceShell>
}
