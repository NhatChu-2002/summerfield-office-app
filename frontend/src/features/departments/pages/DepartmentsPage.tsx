import { ArrowRight } from 'lucide-react'
import { initials } from '@/shared/lib/format'
import { deptHref } from '@/shared/lib/routing'
import { departmentRole, type Access } from '@/features/auth'
import type { HqTask } from '@/features/tasks'

export function DepartmentsPage({ access, tasks }: { access: Access; tasks: HqTask[] }) {
  return <><div className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Departments</h1><p>Open a team space to see its tasks and updates.</p></div></div><div className="department-grid full-grid">{access.departments.map((item, index) => <a className={`department-tile tint-${index % 5}`} href={deptHref(item.code)} key={item.code}><div><span className="department-monogram">{initials(item.shortName)}</span><ArrowRight size={17} /></div><strong>{item.name}</strong><p>{item.description}</p><small>{departmentRole(access, item.code)} access · {tasks.filter((task) => task.department_code === item.code && task.status === 'open').length} open tasks</small></a>)}</div>{!access.departments.length && <div className="empty-state"><p>No departments have been assigned to this account.</p></div>}</>
}
