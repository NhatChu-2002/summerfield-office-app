import { Folder, Plus } from 'lucide-react'
import { departmentStyle, referenceHref, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import { DepartmentIcon } from '@/shared/ui/icons'
import './folders.css'

export function DepartmentFolderCard({ department, showDashboard = false, showSharedEmpty = false }: {
  department: ReferenceDepartment
  showDashboard?: boolean
  showSharedEmpty?: boolean
}) {
  return <section className="vy-folder-panel" style={departmentStyle(department.color)} aria-label={`${department.name} folders`}>
    <div className="vy-folder-panel-head">
      <h2><DepartmentIcon code={department.code} size={23} /> {department.name}</h2>
      <div className="vy-folder-panel-actions">
        {showDashboard && <a className="vy-button vy-button-small" href={referenceHref(department.code)}>Open dashboard</a>}
        <ComingSoonButton><Plus size={14} /> Add</ComingSoonButton>
      </div>
    </div>
    <h3>Google Drive</h3>
    {department.folders.length ? <ul className="vy-folder-list">
      {department.folders.map((folder) => <li key={folder}><Folder size={16} fill="#c79a73" strokeWidth={1.5} aria-hidden="true" /><span>{folder}</span></li>)}
    </ul> : <p className="vy-empty">No Drive folders set up yet.</p>}
    {showSharedEmpty && <><h3>Shared here by the team</h3><p className="vy-empty">No shared files yet.</p></>}
  </section>
}
