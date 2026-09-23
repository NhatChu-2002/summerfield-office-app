import { Check, CircleCheck } from 'lucide-react'
import { departmentByCode } from '@/shared/config/departments'
import { displayDate, todayLocal } from '@/shared/lib/format'
import { deptHref } from '@/shared/lib/routing'
import type { Access } from '@/features/auth'
import type { HqTask } from '../api'
import { canChangeTask } from '../model'

export function TaskList({ tasks, access, onToggle, busyId, empty }: {
  tasks: HqTask[]; access: Access; onToggle: (task: HqTask) => void;
  busyId: string | null; empty: string
}) {
  if (!tasks.length) return <div className="empty-state"><CircleCheck size={22} /><p>{empty}</p></div>
  return <div className="task-list">
    {tasks.map((task) => {
      const allowed = canChangeTask(access, task)
      const overdue = task.status === 'open' && Boolean(task.due_date && task.due_date < todayLocal())
      return <div className={`task-row ${task.status === 'done' ? 'task-done' : ''}`} key={task.id}>
        <button className="task-check" type="button" disabled={!allowed || busyId === task.id}
          onClick={() => onToggle(task)} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`}
          title={allowed ? (task.status === 'done' ? 'Reopen task' : 'Complete task') : 'Only the creator, assignee, or lead can update this task'}>
          {task.status === 'done' ? <Check size={16} strokeWidth={3} /> : null}
        </button>
        <div className="task-main">
          <div className="task-title">{task.title}</div>
          {task.details && <p>{task.details}</p>}
          <div className="row-meta"><a href={deptHref(task.department_code)}>{departmentByCode(task.department_code)?.shortName || task.department_code}</a><span className="meta-separator">·</span><span className={overdue ? 'overdue' : ''}>{task.due_date ? `Due ${displayDate(task.due_date)}` : 'No due date'}</span>{task.assigned_to === access.userId && <span className="assigned-pill">Assigned to you</span>}</div>
        </div>
      </div>
    })}
  </div>
}
