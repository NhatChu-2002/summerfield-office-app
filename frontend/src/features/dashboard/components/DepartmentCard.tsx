import { Folder } from 'lucide-react'
import { departmentStyle, referenceHref, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import { DepartmentIcon } from '@/shared/ui/icons'

export function DepartmentCard({ department, myDepartment }: { department: ReferenceDepartment; myDepartment: string }) {
  return <article className="vy-department-card" style={departmentStyle(department.color)}>
    <div className="vy-department-card-head"><div className="vy-card-title"><h3><DepartmentIcon code={department.code} size={22} /> {department.name}</h3>{myDepartment === department.code && <span className="vy-tag">My department</span>}</div><p>{department.full}</p></div>
    <div className="vy-department-card-body"><p className="vy-muted">Nothing on the calendar in the next 6 weeks</p><div className="vy-folder-lines">{department.folders.slice(0, 3).map((folder) => <span key={folder}><Folder size={13} fill="#c79a73" strokeWidth={1.5} />{folder}</span>)}{department.folders.length > 3 && <a href={referenceHref(department.code)}>+{department.folders.length - 3} more</a>}</div><div className="vy-card-actions"><a className="vy-button vy-button-dark vy-button-small" href={referenceHref(department.code)}>Open {department.name}</a>{department.tool && <ComingSoonButton>{department.tool}</ComingSoonButton>}</div></div>
  </article>
}
