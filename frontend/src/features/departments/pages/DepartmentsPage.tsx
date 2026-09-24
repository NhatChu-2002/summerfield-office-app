import { ArrowRight } from 'lucide-react'
import { companyDepartment, departmentStyle, referenceDepartments, referenceForDepartment } from '@/shared/config/reference-departments'
import { deptHref } from '@/shared/lib/routing'
import { DepartmentIcon } from '@/shared/ui/icons'
import { departmentRole, type Access } from '@/features/auth'
import type { HqTask } from '@/features/tasks'
import './departments.css'

export function DepartmentsPage({ access, tasks, preview = false }: { access: Access; tasks: HqTask[]; preview?: boolean }) {
  const departments = preview ? [companyDepartment, ...referenceDepartments] : access.departments.map(referenceForDepartment)
  return <>
    <header className="vy-hero vy-departments-hero"><div><h1>Departments</h1><p>Pick a department to see its tools, folders, and dates.</p></div></header>
    {preview && <p className="vy-departments-note">Design preview: reference departments only. Company records are not connected.</p>}
    {departments.length ? <div className="vy-departments-grid">{departments.map((department) => {
      const count = preview ? 0 : tasks.filter((task) => task.department_code === department.code && task.status === 'open').length
      const role = preview ? 'Preview' : departmentRole(access, department.code)
      return <a className="vy-department-index-card" style={departmentStyle(department.color)} href={deptHref(department.code)} key={department.code}>
        <div className="vy-department-index-icon"><DepartmentIcon code={department.code} size={25} /><ArrowRight size={16} /></div>
        <h2>{department.name}</h2><p>{department.full}</p>
        <span>{role ? `${role} access` : 'Assigned department'}{!preview && ` · ${count} open task${count === 1 ? '' : 's'}`}</span>
      </a>
    })}</div> : <p className="vy-departments-empty">No departments have been assigned to this account.</p>}
  </>
}
