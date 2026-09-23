import type { Access } from '@/features/auth'
import type { HqTask } from '../api'
import { TaskList } from '../components/TaskList'
import type { TaskScope, TaskStatusFilter } from '../model'

// Filters are passed in so they survive moving between pages.
export function TasksPage({ access, tasks, scope, status, onScope, onStatus, onToggle, busyId }: {
  access: Access; tasks: HqTask[]; scope: TaskScope; status: TaskStatusFilter
  onScope: (scope: TaskScope) => void; onStatus: (status: TaskStatusFilter) => void
  onToggle: (task: HqTask) => void; busyId: string | null
}) {
  const visible = tasks.filter((task) => (scope === 'all' || task.assigned_to === access.userId) && (status === 'all' || task.status === status))
  return <><div className="page-heading"><div><p className="eyebrow">Work</p><h1>Tasks</h1><p>Track what is due across the departments you can access.</p></div></div><section className="section list-page"><div className="filter-row"><div className="segmented" role="group" aria-label="Task scope"><button type="button" className={scope === 'mine' ? 'selected' : ''} onClick={() => onScope('mine')}>Assigned to me</button><button type="button" className={scope === 'all' ? 'selected' : ''} onClick={() => onScope('all')}>All visible</button></div><label className="status-filter">Status <select value={status} onChange={(event) => onStatus(event.target.value as TaskStatusFilter)}><option value="open">Open</option><option value="done">Completed</option><option value="all">All</option></select></label></div><TaskList tasks={visible} access={access} onToggle={onToggle} busyId={busyId} empty="No tasks match these filters." /></section></>
}
