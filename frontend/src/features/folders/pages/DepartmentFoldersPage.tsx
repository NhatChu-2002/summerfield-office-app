import { FolderOpen, Plus } from 'lucide-react'
import { companyDepartment, sortLikeReference, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import { DepartmentFolderCard } from '../components/DepartmentFolderCard'

export function DepartmentFoldersPage({ departments, dashboardCodes }: {
  departments: ReferenceDepartment[]
  dashboardCodes: string[]
}) {
  const cards = [companyDepartment, ...sortLikeReference(departments.filter((item) => item.code !== 'company'))]
  const dashboards = new Set(dashboardCodes)

  return <>
    <header className="vy-hero vy-folders-hero">
      <div><h1><FolderOpen size={34} aria-hidden="true" /> Department folders</h1><p>Shared folders, organized by team.</p></div>
      <div className="vy-hero-actions"><ComingSoonButton small={false}><Plus size={15} /> Add a link or file</ComingSoonButton></div>
    </header>
    <p className="vy-folders-status">Google Drive links and shared-file actions are not connected yet.</p>
    <div className="vy-folders-grid">{cards.map((department) => <DepartmentFolderCard key={department.code} department={department} showDashboard={dashboards.has(department.code)} />)}</div>
  </>
}
