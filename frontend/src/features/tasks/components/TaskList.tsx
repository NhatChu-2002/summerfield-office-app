import { departmentByCode } from '@/shared/config/departments'
import { departmentStyle, referenceByCode } from '@/shared/config/reference-departments'
import { displayDate, todayLocal } from '@/shared/lib/format'
import { deptHref } from '@/shared/lib/routing'
import type { Access } from '@/features/auth'
import type { HqTask } from '../api'
import { isOverdue } from '../model'
import { canChangeTask } from '../permissions'
import './tasks.css'

/** Display names by user id. Anyone missing shows as "Teammate". */
export type PeopleNames = Record<string, string>

export function assigneeLabel(task: HqTask, access: Access, names: PeopleNames) {
  if (!task.assigned_to) return 'Unassigned'
  if (task.assigned_to === access.userId) return 'You'
  return names[task.assigned_to] || 'Teammate'
}

export function TaskList({ tasks, access, onToggle, busyId, empty, onOpen, names = {} }: {
  tasks: HqTask[]; access: Access; onToggle: (task: HqTask) => void;
  busyId: string | null; empty: string; onOpen?: (task: HqTask) => void; names?: PeopleNames
}) {
  if (!tasks.length) return <div className="vy-task-empty">{empty}</div>
  const today = todayLocal()
  return <ul className="vy-task-list">
    {tasks.map((task) => {
      const allowed = canChangeTask(access, task)
      const overdue = isOverdue(task, today)
      const done = task.status === 'done'
      const reference = referenceByCode(task.department_code)
      return <li className={`vy-task ${done ? 'is-done' : ''}`} key={task.id}>
        <input type="checkbox" className="vy-task-check" checked={done} disabled={!allowed || busyId === task.id}
          onChange={() => onToggle(task)} aria-label={`Mark ${task.title} ${done ? 'not done' : 'done'}`}
          title={allowed ? undefined : 'Only the creator, assignee, or a department lead can change this task'} />
        <div>
          <div className="vy-task-title">{task.title}</div>
          <div className="vy-task-sub">
            {task.due_date && <span className={overdue ? 'is-overdue' : ''}>{overdue ? 'Overdue' : 'Due'} {displayDate(task.due_date)}</span>}
            <span>{assigneeLabel(task, access, names)}</span>
            <a className="vy-task-dept" href={deptHref(task.department_code)} style={departmentStyle(reference?.color || '#E3E8E3')}>
              {reference?.name || departmentByCode(task.department_code)?.shortName || task.department_code}
            </a>
          </div>
        </div>
        <div className="vy-task-actions">{onOpen && <button type="button" className="vy-button vy-button-small" onClick={() => onOpen(task)} aria-label={`Open ${task.title}`}>Open</button>}</div>
      </li>
    })}
  </ul>
}
