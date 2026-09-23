// Pure task rules: no React, no network, only type imports. Tested by model.test.mjs.
import type { HqTask } from './api'

export type TaskBucket = { name: 'Overdue' | 'Today' | 'This week' | 'Later' | 'Done'; tasks: HqTask[] }

const DONE_SHOWN = 15

/** Adds days to a YYYY-MM-DD date without time-zone drift. */
export function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

export function isOverdue(task: HqTask, today: string) {
  return task.status === 'open' && Boolean(task.due_date && task.due_date < today)
}

// Open before done, then by due date, then newest first.
export function compareTasks(a: HqTask, b: HqTask) {
  if (a.status !== b.status) return a.status === 'open' ? -1 : 1
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
  if (a.due_date) return -1
  if (b.due_date) return 1
  return b.created_at.localeCompare(a.created_at)
}

/**
 * My tasks, grouped as in Vy's design: overdue, due today, due within a week, later (or no date),
 * and the most recently completed. Empty groups are left out.
 */
export function bucketMyTasks(tasks: HqTask[], userId: string, today: string): TaskBucket[] {
  const mine = tasks.filter((task) => task.assigned_to === userId).sort(compareTasks)
  const open = mine.filter((task) => task.status === 'open')
  const weekEnd = addDays(today, 7)
  const done = mine.filter((task) => task.status === 'done')
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    .slice(0, DONE_SHOWN)
  const buckets: TaskBucket[] = [
    { name: 'Overdue', tasks: open.filter((task) => isOverdue(task, today)) },
    { name: 'Today', tasks: open.filter((task) => task.due_date === today) },
    { name: 'This week', tasks: open.filter((task) => task.due_date && task.due_date > today && task.due_date <= weekEnd) },
    { name: 'Later', tasks: open.filter((task) => !task.due_date || task.due_date > weekEnd) },
    { name: 'Done', tasks: done },
  ]
  return buckets.filter((bucket) => bucket.tasks.length)
}

/** Open tasks this person created and gave to someone else. */
export function delegatedTasks(tasks: HqTask[], userId: string) {
  return tasks.filter((task) => task.status === 'open' && task.created_by === userId
    && task.assigned_to && task.assigned_to !== userId).sort(compareTasks)
}
