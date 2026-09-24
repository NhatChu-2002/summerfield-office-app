import { Suspense, useState, type ReactNode } from 'react'
import { companyDepartment, referenceForDepartment } from '@/shared/config/reference-departments'
import type { Route } from '@/shared/lib/routing'
import { Notice } from '@/shared/ui/Notice'
import { useToast } from '@/shared/ui/toast'
import { canWriteDepartment, type Access } from '@/features/auth'
import { CalendarPage } from '@/features/calendar'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentPage, DepartmentsPage } from '@/features/departments'
import { DepartmentFoldersPage } from '@/features/folders'
import { HelpPage } from '@/features/help'
import { DecisionChartPage, WhoToAskPage } from '@/features/ownership'
import { ProjectPage, ProjectsPage } from '@/features/projects'
import { todayLocal } from '@/shared/lib/format'
import { compareTasks, MyTasksPage, TaskDetailsDialog, TaskDialog, TaskList } from '@/features/tasks'
import { UpdateList, UpdatesPage } from '@/features/updates'
import { WatchPage } from '@/features/watch'
import { PlaceholderPage, WorkspaceShell } from '@/features/workspace'
import { useHqData } from './providers/HqDataProvider'

type NewTaskRequest = { department?: string; assignToMe: boolean }

// The signed-in workspace: picks the page for the current route and hands it the data it needs.
export function AppRoutes({ route, access, onSignOut, onOrganization, onEnterPreview }: {
  route: Route; access: Access; onSignOut: () => void; onOrganization: (id: string) => void; onEnterPreview?: () => void
}) {
  const { tasks, updates, dataReady, loading, error, refresh, busyTaskId, names, toggleTask, addTask, addUpdate } = useHqData()
  const toast = useToast()
  const [newTask, setNewTask] = useState<NewTaskRequest | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const writableDepartments = access.departments.filter((item) => canWriteDepartment(access, item.code))
  const myOpenTasks = tasks.filter((task) => task.status === 'open' && task.assigned_to === access.userId).sort(compareTasks)
  const department = route.code ? access.departments.find((item) => item.code === route.code) : undefined
  const openTask = openTaskId ? tasks.find((task) => task.id === openTaskId) : undefined
  const openDetails = (task: { id: string }) => setOpenTaskId(task.id)

  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <DashboardPage access={access} tasks={tasks} updates={updates} preview={false} dataReady={dataReady}
      taskContent={<TaskList tasks={myOpenTasks.slice(0, 6)} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="Nothing is assigned to you right now." onOpen={openDetails} names={names} />}
      updateContent={<UpdateList updates={updates.slice(0, 5)} empty="No team updates yet." />} />
  } else if (route.page === 'department') {
    content = department
      ? <DepartmentPage key={department.code} access={access} department={department} tasks={tasks} updates={updates} names={names} busyTaskId={busyTaskId} dataReady={dataReady} onToggle={toggleTask} onOpenTask={openDetails} onNewTask={() => setNewTask({ department: department.code, assignToMe: false })} onPosted={(update) => { if (addUpdate(update)) toast('Update posted.') }} />
      : <div className="empty-page"><h1>Department unavailable</h1><p>This department is not assigned to your account.</p><a className="button" href="#/departments">View your departments</a></div>
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarPage departments={access.departments.map(referenceForDepartment)} preview={false} /></Suspense>
  } else if (route.page === 'departments') {
    content = <DepartmentsPage access={access} tasks={tasks} />
  } else if (route.page === 'folders') {
    content = <DepartmentFoldersPage departments={access.departments.map(referenceForDepartment)} dashboardCodes={access.departments.map((item) => item.code)} />
  } else if (route.page === 'help') {
    content = <Suspense fallback={<p role="status">Loading guides...</p>}><HelpPage departments={access.departments} /></Suspense>
  } else if (route.page === 'watch') {
    content = <Suspense fallback={<p role="status">Loading Market watch...</p>}><WatchPage departments={[companyDepartment, ...access.departments.map(referenceForDepartment)]} preview={false} /></Suspense>
  } else if (route.page === 'ask') {
    content = <Suspense fallback={<p role="status">Loading Who to ask...</p>}><WhoToAskPage departments={access.departments.map(referenceForDepartment)} people={[]} currentUser={access.userId} areas={[]} profiles={[]} preview={false} /></Suspense>
  } else if (route.page === 'decisions') {
    content = <Suspense fallback={<p role="status">Loading Decision chart...</p>}><DecisionChartPage departments={access.departments.map(referenceForDepartment)} people={[]} currentUser={access.userId} rules={[]} preview={false} /></Suspense>
  } else if (route.page === 'projects') {
    content = <ProjectsPage departments={access.departments.map(referenceForDepartment)} people={[]} currentUser={access.userId} projects={[]} tasks={[]} preview={false}
      liveTaskStats={dataReady ? { overdue: tasks.filter((task) => task.status === 'open' && !!task.due_date && task.due_date < todayLocal()).length, mine: myOpenTasks.length } : undefined} />
  } else if (route.page === 'project') {
    content = <ProjectPage id={route.code || ''} departments={access.departments.map(referenceForDepartment)} people={[]} currentUser={access.userId} projects={[]} tasks={[]} messages={[]} preview={false} />
  } else if (route.page === 'tasks') {
    content = <MyTasksPage access={access} tasks={tasks} dataReady={dataReady} names={names} busyId={busyTaskId}
      canCreate={dataReady && writableDepartments.length > 0} onNewTask={() => setNewTask({ assignToMe: true })}
      onToggle={toggleTask} onOpen={openDetails} />
  } else if (route.page === 'updates') {
    content = <UpdatesPage updates={updates} />
  } else {
    content = <PlaceholderPage page={route.page} />
  }

  return <WorkspaceShell access={access} route={route} preview={false} onRefresh={() => void refresh()} refreshing={loading} onOrganization={onOrganization} onSignOut={onSignOut} onExitPreview={() => {}} onEnterPreview={onEnterPreview}>
    {error && route.page === 'updates' && <Notice>HQ data could not be loaded: {error}</Notice>}
    {content}
    {newTask && <TaskDialog access={access} departments={writableDepartments} initialDepartment={newTask.department} assignToMe={newTask.assignToMe}
      onClose={() => setNewTask(null)} onCreated={(task) => { if (addTask(task)) toast('Task created.') }} />}
    {openTask && <TaskDetailsDialog task={openTask} access={access} names={names} busy={busyTaskId === openTask.id}
      onToggle={toggleTask} onClose={() => setOpenTaskId(null)} />}
  </WorkspaceShell>
}
