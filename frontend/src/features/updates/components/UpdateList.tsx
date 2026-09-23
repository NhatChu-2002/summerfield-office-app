import { Bell } from 'lucide-react'
import { departmentByCode } from '@/shared/config/departments'
import { initials, relativeTime } from '@/shared/lib/format'
import { deptHref } from '@/shared/lib/routing'
import type { HqUpdate } from '../api'

export function UpdateList({ updates, empty }: { updates: HqUpdate[]; empty: string }) {
  if (!updates.length) return <div className="empty-state"><Bell size={22} /><p>{empty}</p></div>
  return <div className="update-list">{updates.map((update) => <article className="update-item" key={update.id}>
    <span className="avatar" aria-hidden="true">{initials(update.author_name)}</span>
    <div><div className="update-meta"><strong>{update.author_name}</strong><span>·</span><a href={deptHref(update.department_code)}>{departmentByCode(update.department_code)?.shortName || update.department_code}</a><span>·</span><time dateTime={update.created_at}>{relativeTime(update.created_at)}</time></div><p>{update.body}</p></div>
  </article>)}</div>
}
