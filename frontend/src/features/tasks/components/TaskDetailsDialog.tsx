import { useEffect, useRef } from 'react'
import { departmentByCode } from '@/shared/config/departments'
import { departmentStyle, referenceByCode } from '@/shared/config/reference-departments'
import { displayDate, relativeTime, todayLocal } from '@/shared/lib/format'
import type { Access } from '@/features/auth'
import type { HqTask } from '../api'
import { isOverdue } from '../model'
import { canChangeTask } from '../permissions'
import { assigneeLabel, type PeopleNames } from './TaskList'
import './tasks.css'

// "today", "3 days ago", or "on Sep 3, 2026", to read well mid-sentence.
function when(value: string) {
  const text = relativeTime(value)
  return text === 'Today' || text === 'Yesterday' ? text.toLowerCase() : text.endsWith('ago') ? text : `on ${text}`
}

// What "Open" shows. HQ can't edit task fields yet, so this reads them and offers done / reopen.
export function TaskDetailsDialog({ task, access, names = {}, busy, onToggle, onClose }: {
  task: HqTask; access: Access; names?: PeopleNames; busy: boolean
  onToggle: (task: HqTask) => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  // Removing an open dialog closes it without a close event, so there's nothing to undo on unmount.
  // (Calling close() here would fire onClose when React re-runs effects in development.)
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [])
  const reference = referenceByCode(task.department_code)
  const overdue = isOverdue(task, todayLocal())
  const creator = task.created_by === access.userId ? 'You' : names[task.created_by] || 'Teammate'

  return <dialog ref={dialog} className="vy-task-dialog" onClose={onClose} onCancel={onClose} aria-labelledby="task-details-title">
    <div className="vy-task-form">
      <h2 id="task-details-title">{task.title}</h2>
      <dl className="vy-task-facts">
        <dt>Department</dt>
        <dd><span className="vy-task-dept" style={departmentStyle(reference?.color || '#E3E8E3')}>{reference?.name || departmentByCode(task.department_code)?.shortName || task.department_code}</span></dd>
        <dt>Status</dt><dd>{task.status === 'done' ? `Done${task.completed_at ? ` ${when(task.completed_at)}` : ''}` : 'Open'}</dd>
        <dt>Due</dt><dd className={overdue ? 'is-overdue' : ''}>{task.due_date ? `${overdue ? 'Overdue · ' : ''}${displayDate(task.due_date, true)}` : 'No due date'}</dd>
        <dt>Assigned to</dt><dd>{assigneeLabel(task, access, names)}</dd>
        <dt>Asked by</dt><dd>{creator}, {when(task.created_at)}</dd>
      </dl>
      <p className="vy-task-details">{task.details || 'No details.'}</p>
      <p className="vy-task-note">Editing, comments and files will be added when HQ tasks support them.</p>
      <div className="vy-task-foot">
        <button className="vy-button" type="button" onClick={onClose}>Close</button>
        {canChangeTask(access, task) && <button className="vy-button vy-button-dark" type="button" disabled={busy} onClick={() => onToggle(task)}>{task.status === 'done' ? 'Reopen task' : 'Mark done'}</button>}
      </div>
    </div>
  </dialog>
}
