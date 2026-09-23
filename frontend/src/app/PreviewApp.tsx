import { Suspense, useState, type ReactNode } from 'react'
import { DEPARTMENTS } from '@/shared/config/departments'
import { companyDepartment, referenceByCode, referenceDepartments } from '@/shared/config/reference-departments'
import type { Route } from '@/shared/lib/routing'
import type { Access } from '@/features/auth'
import { CalendarPage, type CalendarDraft } from '@/features/calendar'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentLayout } from '@/features/departments'
import { PlaceholderPage, WorkspaceShell } from '@/features/workspace'

// Design preview: every screen with no company data and nothing saved.
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

export function PreviewApp({ route, onExit }: { route: Route; onExit: () => void }) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarDraft[]>([])
  const department = route.code === 'company' ? companyDepartment : route.code ? referenceByCode(route.code) : undefined
  let content: ReactNode
  if (route.page === 'dashboard') {
    content = <DashboardPage access={previewAccess} tasks={[]} updates={[]} preview dataReady={false} taskContent={null} updateContent={null} />
  } else if (route.page === 'calendar') {
    content = <Suspense fallback={<p role="status">Loading calendar...</p>}><CalendarPage departments={[companyDepartment, ...referenceDepartments]} preview events={calendarEvents} onChange={setCalendarEvents} /></Suspense>
  } else if (route.page === 'department' && department) {
    content = <DepartmentLayout department={department} role="Preview" taskContent={null} updateContent={null} onNewTask={() => {}} writable={false} dataReady={false} />
  } else if (route.page === 'department') {
    content = <PlaceholderPage page="Departments" />
  } else {
    content = <PlaceholderPage page={route.page} />
  }
  return <WorkspaceShell access={previewAccess} route={route} preview refreshing={false} onRefresh={() => {}} onOrganization={() => {}} onSignOut={() => {}} onExitPreview={onExit}>{content}</WorkspaceShell>
}
