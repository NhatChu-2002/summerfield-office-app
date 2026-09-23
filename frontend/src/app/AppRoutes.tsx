import { Suspense, useMemo, useState, type ReactNode } from 'react'
import type { Department } from '@/shared/config/departments'
import { referenceForDepartment } from '@/shared/config/reference-departments'
import type { Route } from '@/shared/lib/routing'
import { Notice } from '@/shared/ui/Notice'
import { useToast } from '@/shared/ui/toast'
import type { Access } from '@/features/auth'
import { CalendarPage } from '@/features/calendar'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentPage, DepartmentsPage } from '@/features/departments'
import { compareTasks, TaskDialog, TaskList, TasksPage, type TaskScope, type TaskStatusFilter } from '@/features/tasks'
import { UpdateList, UpdatesPage } from '@/features/updates'
import { PlaceholderPage, WorkspaceShell } from '@/features/workspace'
import { useHqData } from './providers/HqDataProvider'

// The signed-in workspace: picks the page for the current route and hands it the data it needs.
export function AppRoutes({ route, access, onSignOut, onOrganization, onEnterPreview }: {
  route: Route; access: Access; onSignOut: () => void; onOrganization: (id: string) => void; onEnterPreview?: () => void
}) {
  const { tasks, updates, dataReady, loading, error, refresh, busyTaskId, toggleTask, addTask, addUpdate } = useHqData()
  const toast = useToast()
  const [taskDepartment, setTaskDepartment] = useState<Department | null>(null)
  const [taskScope, setTaskScope] = useState<TaskScope>('mine')
  const [taskStatus, setTaskStatus] = useState<TaskStatusFilter>('open')

  const sortedTasks = useMemo(() => [...tasks].sort(compareTasks), [tasks])
  const myOpenTasks = sortedTasks.filter((task) => task.status === 'open' && task.assigned_to === access.userId)
  const department = route.code ? access.departments.find((item) => item.code === route.code) : undefined

  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <DashboardPage access={access} tasks={tasks} updates={updates} preview={false} dataReady={dataReady}
      taskContent={<TaskList tasks={myOpenTasks.slice(0, 6)} access={access} onToggle={toggleTask} busyId={busyTaskId} empty="Nothing is assigned to you right now." />}
      updateContent={<UpdateList updates={updates.slice(0, 5)} empty="No team updates yet." />} />
  } else if (route.page === 'department') {
    content = department
      ? <DepartmentPage key={department.code} access={access} department={department} tasks={tasks} updates={updates} busyTaskId={busyTaskId} dataReady={dataReady} onToggle={toggleTask} onNewTask={() => setTaskDepartment(department)} onPosted={(update) => { if (addUpdate(update)) toast('Update posted.') }} />
      : <div className="empty-page"><h1>Department unavailable</h1><p>This department is not assigned to your account.</p><a className="button" href="#/departments">View your departments</a></div>
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarPage departments={access.departments.map(referenceForDepartment)} preview={false} /></Suspense>
  } else if (route.page === 'departments') {
    content = <DepartmentsPage access={access} tasks={tasks} />
  } else if (route.page === 'tasks') {
    content = <TasksPage access={access} tasks={sortedTasks} scope={taskScope} status={taskStatus} onScope={setTaskScope} onStatus={setTaskStatus} onToggle={toggleTask} busyId={busyTaskId} />
  } else if (route.page === 'updates') {
    content = <UpdatesPage updates={updates} />
  } else {
    content = <PlaceholderPage page={route.page} />
  }

  return <WorkspaceShell access={access} route={route} preview={false} onRefresh={() => void refresh()} refreshing={loading} onOrganization={onOrganization} onSignOut={onSignOut} onExitPreview={() => {}} onEnterPreview={onEnterPreview}>
    {error && !['dashboard', 'department'].includes(route.page) && <Notice>HQ data could not be loaded: {error}</Notice>}
    {content}
    {taskDepartment && <TaskDialog access={access} department={taskDepartment} onClose={() => setTaskDepartment(null)} onCreated={(task) => { if (addTask(task)) toast('Task created.') }} />}
  </WorkspaceShell>
}
