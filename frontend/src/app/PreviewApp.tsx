import { Suspense, useState, type ReactNode } from 'react'
import { DEPARTMENTS } from '@/shared/config/departments'
import { companyDepartment, previewOnlyDepartments, referenceByCode, referenceDepartments } from '@/shared/config/reference-departments'
import type { Route } from '@/shared/lib/routing'
import type { Access } from '@/features/auth'
import { CalendarPage, type CalendarDraft } from '@/features/calendar'
import { CatalogPage, previewCatalogRows, previewCatalogStandards, previewCatalogVendors, type CatalogChange, type CatalogRow } from '@/features/catalog'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentLayout, DepartmentsPage } from '@/features/departments'
import { DepartmentFoldersPage } from '@/features/folders'
import { HelpPage } from '@/features/help'
import { LearningPage, LessonPage, previewLessons, type LearningProgress, type Lesson } from '@/features/learning'
import { LocationPage, LocationsPage, previewLocationEquipment, previewLocations, type LocationEquipment, type LocationRecord } from '@/features/locations'
import { MeetingsPage, previewMeetings, type MeetingRecord } from '@/features/meetings'
import { todayLocal } from '@/shared/lib/format'
import { DecisionChartPage, previewAreas, previewDecisions, previewProfiles, WhoToAskPage, type ContactProfile, type DecisionRule, type OwnershipArea } from '@/features/ownership'
import { PeoplePage, previewAccessPeople, previewAccessRequests, type PreviewPerson, type PreviewRequest } from '@/features/people'
import { ProjectPage, ProjectsPage, previewProjectMessages, previewProjects, previewProjectTasks, type ProjectMessage, type ProjectRecord, type ProjectTask } from '@/features/projects'
import { ReportPage, ReportsPage, previewReports, type ReportRecord } from '@/features/reports'
import { SopPage, previewSops, type SopDraft } from '@/features/sop'
import { MyTasksPage, TaskDetailsDialog, TaskDialog, type HqTask } from '@/features/tasks'
import { TimePage, previewTimeCorrections, previewTimeEntries, type TimeCorrection, type TimeEntry } from '@/features/time'
import { PlaceholderPage, WorkspaceShell } from '@/features/workspace'
import { WatchPage, type WatchItem } from '@/features/watch'
import { PREVIEW_USER, previewNames, previewPeople, previewTask, previewTasks } from './preview-data'

// Design preview: every screen with no company data and nothing saved.
const previewAccess: Access = {
  userId: PREVIEW_USER, displayName: 'Preview', email: '',
  organization: { organization_id: 'design-preview', organization_name: 'Summerfield', organization_slug: 'summerfield', role: 'viewer' },
  organizations: [], assignments: [],
  departments: [...DEPARTMENTS, ...previewOnlyDepartments],
}

// Stable, so the task dialog doesn't reload its people list on every render.
const loadPreviewPeople = async () => previewPeople

export function PreviewApp({ route, onExit }: { route: Route; onExit: () => void }) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarDraft[]>([])
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>(previewCatalogRows)
  const [catalogChanges, setCatalogChanges] = useState<CatalogChange[]>([])
  const [tasks, setTasks] = useState<HqTask[]>(previewTasks)
  const [watchItems, setWatchItems] = useState<WatchItem[]>([])
  const [areas, setAreas] = useState<OwnershipArea[]>(previewAreas)
  const [profiles, setProfiles] = useState<ContactProfile[]>(previewProfiles)
  const [decisions, setDecisions] = useState<DecisionRule[]>(previewDecisions)
  const [accessPeople, setAccessPeople] = useState<PreviewPerson[]>(previewAccessPeople)
  const [accessRequests, setAccessRequests] = useState<PreviewRequest[]>(previewAccessRequests)
  const [projects, setProjects] = useState<ProjectRecord[]>(previewProjects)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(previewProjectTasks)
  const [projectMessages, setProjectMessages] = useState<ProjectMessage[]>(previewProjectMessages)
  const [ticketManager, setTicketManager] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>(previewLessons)
  const [locations, setLocations] = useState<LocationRecord[]>(previewLocations)
  const [locationEquipment, setLocationEquipment] = useState<LocationEquipment[]>(previewLocationEquipment)
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({ done: {}, scores: {} })
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(previewTimeEntries)
  const [timeCorrections, setTimeCorrections] = useState<TimeCorrection[]>(previewTimeCorrections)
  const [reports, setReports] = useState<ReportRecord[]>(previewReports)
  const [meetings, setMeetings] = useState<MeetingRecord[]>(previewMeetings)
  const [sops, setSops] = useState<SopDraft[]>(previewSops)
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
  } else if (route.page === 'departments') {
    content = <DepartmentsPage access={previewAccess} tasks={[]} preview />
  } else if (route.page === 'help') {
    content = <Suspense fallback={<p role="status">Loading guides...</p>}><HelpPage departments={previewAccess.departments} /></Suspense>
  } else if (route.page === 'watch') {
    content = <Suspense fallback={<p role="status">Loading Market watch...</p>}><WatchPage departments={[companyDepartment, ...referenceDepartments]} preview items={watchItems} onItemsChange={setWatchItems} /></Suspense>
  } else if (route.page === 'ask') {
    content = <Suspense fallback={<p role="status">Loading Who to ask...</p>}><WhoToAskPage departments={referenceDepartments} people={previewPeople.map((person) => ({ id: person.user_id, name: person.display_name }))} currentUser={PREVIEW_USER} areas={areas} profiles={profiles} preview canViewPeople onAreasChange={setAreas} onProfilesChange={setProfiles} /></Suspense>
  } else if (route.page === 'decisions') {
    content = <Suspense fallback={<p role="status">Loading Decision chart...</p>}><DecisionChartPage departments={referenceDepartments} people={previewPeople.map((person) => ({ id: person.user_id, name: person.display_name }))} currentUser={PREVIEW_USER} rules={decisions} preview onRulesChange={setDecisions} /></Suspense>
  } else if (route.page === 'people') {
    content = <Suspense fallback={<p role="status">Loading People & access...</p>}><PeoplePage departments={referenceDepartments} people={accessPeople} requests={accessRequests} preview admin onPeopleChange={setAccessPeople} onRequestsChange={setAccessRequests} /></Suspense>
  } else if (route.page === 'projects') {
    content = <ProjectsPage departments={referenceDepartments} people={projectPeople} currentUser={PREVIEW_USER} projects={projects} tasks={projectTasks} preview ticketManager={ticketManager} onTicketManagerChange={setTicketManager} onProjectsChange={setProjects} onTasksChange={setProjectTasks} />
  } else if (route.page === 'project') {
    content = <ProjectPage id={route.code || ''} departments={referenceDepartments} people={projectPeople} currentUser={PREVIEW_USER} projects={projects} tasks={projectTasks} messages={projectMessages} preview onProjectsChange={setProjects} onTasksChange={setProjectTasks} onMessagesChange={setProjectMessages} />
  } else if (route.page === 'locations') {
    content = <LocationsPage locations={locations} equipment={locationEquipment} preview onLocationsChange={setLocations} />
  } else if (route.page === 'location') {
    content = <LocationPage key={route.code} id={route.code || ''} locations={locations} equipment={locationEquipment} projects={projects} tasks={projectTasks} preview onLocationsChange={setLocations} onEquipmentChange={setLocationEquipment} />
  } else if (route.page === 'catalog') {
    content = <CatalogPage rows={catalogRows} vendors={previewCatalogVendors} standards={previewCatalogStandards} changes={catalogChanges} preview onRowsChange={setCatalogRows} onChangesChange={setCatalogChanges} />
  } else if (route.page === 'learn') {
    content = <Suspense fallback={<p role="status">Loading Learning...</p>}><LearningPage departments={referenceDepartments} lessons={lessons} progress={learningProgress} preview onLessonsChange={setLessons} /></Suspense>
  } else if (route.page === 'lesson') {
    content = <Suspense fallback={<p role="status">Loading lesson...</p>}><LessonPage key={route.code} id={route.code || ''} departments={referenceDepartments} lessons={lessons} progress={learningProgress} preview
      onMarkDone={(id) => setLearningProgress((current) => ({ ...current, done: { ...current.done, [id]: todayLocal() } }))}
      onSaveScore={(id, score) => setLearningProgress((current) => ({ done: { ...current.done, [id]: todayLocal() }, scores: { ...current.scores, [id]: score } }))}
      onDelete={(id) => { setLessons((current) => current.filter((item) => item.id !== id)); setLearningProgress((current) => { const done = { ...current.done }; const scores = { ...current.scores }; delete done[id]; delete scores[id]; return { done, scores } }) }} /></Suspense>
  } else if (route.page === 'time') {
    content = <Suspense fallback={<p role="status">Loading Time clock...</p>}><TimePage entries={timeEntries} corrections={timeCorrections} preview canReview onEntriesChange={setTimeEntries} onCorrectionsChange={setTimeCorrections} /></Suspense>
  } else if (route.page === 'reports') {
    content = <Suspense fallback={<p role="status">Loading reports...</p>}><ReportsPage departments={referenceDepartments} reports={reports} preview selectedMonth={route.month} /></Suspense>
  } else if (route.page === 'report') {
    content = <Suspense fallback={<p role="status">Loading report...</p>}><ReportPage key={`${route.code}-${route.month}`} departmentCode={route.code || ''} month={route.month || ''} departments={referenceDepartments} reports={reports} preview onReportsChange={setReports} /></Suspense>
  } else if (route.page === 'meetings') {
    content = <Suspense fallback={<p role="status">Loading meetings...</p>}><MeetingsPage departments={referenceDepartments} projects={projects.map((item) => ({ id: item.id, name: item.name }))} meetings={meetings} preview onMeetingsChange={setMeetings} /></Suspense>
  } else if (route.page === 'sop') {
    content = <Suspense fallback={<p role="status">Loading SOP Studio...</p>}><SopPage departments={referenceDepartments} drafts={sops} preview onDraftsChange={setSops} /></Suspense>
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
