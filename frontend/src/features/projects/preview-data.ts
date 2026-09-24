import { todayLocal } from '@/shared/lib/format'
import type { ProjectMessage, ProjectRecord, ProjectTask } from './model'

function shifted(days: number) {
  const date = new Date(`${todayLocal()}T12:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const previewProjects: ProjectRecord[] = [
  { id: 'sample-holiday', name: 'Holiday drinks launch', department: 'marketing', manager: 'sample-avery', members: ['design-preview', 'sample-sam'], start: shifted(-12), due: shifted(28), status: 'track', asanaUrl: '', notes: 'Bring the seasonal menu, photography, and store signage together before launch.' },
  { id: 'sample-site', name: 'New store opening', department: 'build_out', manager: 'sample-sam', members: ['design-preview'], start: shifted(-35), due: shifted(17), status: 'risk', asanaUrl: '', notes: 'Coordinate the site walk, equipment checks, and opening handoff.' },
  { id: 'sample-checklist', name: 'Opening checklist refresh', department: 'operations', manager: 'design-preview', members: ['sample-avery'], start: shifted(-20), due: shifted(-2), status: 'blocked', asanaUrl: '', notes: 'Make the opening checklist clear enough for every shift lead to use.' },
]

export const previewProjectTasks: ProjectTask[] = [
  { id: 'sample-task-1', projectId: 'sample-holiday', department: 'marketing', title: 'Confirm final drink names', details: '', due: shifted(5), priority: 'high', status: 'done', assignee: 'sample-avery', kind: 'task' },
  { id: 'sample-task-2', projectId: 'sample-holiday', department: 'marketing', title: 'Photograph the new drinks', details: 'Use the approved cups and garnish.', due: shifted(8), priority: 'high', status: 'open', assignee: 'design-preview', kind: 'task' },
  { id: 'sample-task-3', projectId: 'sample-holiday', department: 'marketing', title: 'Send signage to stores', details: '', due: shifted(18), priority: 'normal', status: 'open', assignee: 'sample-sam', kind: 'task' },
  { id: 'sample-task-4', projectId: 'sample-site', department: 'build_out', title: 'Walk the new store site', details: '', due: shifted(-3), priority: 'urgent', status: 'open', assignee: 'sample-sam', kind: 'task' },
  { id: 'sample-task-5', projectId: 'sample-site', department: 'build_out', title: 'Confirm equipment delivery', details: '', due: shifted(6), priority: 'normal', status: 'open', assignee: 'design-preview', kind: 'task' },
  { id: 'sample-task-6', projectId: 'sample-checklist', department: 'operations', title: 'Review checklist with shift leads', details: '', due: shifted(-2), priority: 'high', status: 'open', assignee: 'design-preview', kind: 'task' },
  { id: 'sample-ticket-1', projectId: '', department: 'marketing', title: 'Update the lobby menu board', details: 'Replace the retired drinks before the next print run.', due: shifted(11), priority: 'normal', status: 'open', assignee: '', kind: 'ticket' },
]

export const previewProjectMessages: ProjectMessage[] = [
  { id: 'sample-message', projectId: 'sample-holiday', author: 'sample-avery', text: 'The drink names are approved. Photography is next.', at: new Date().toISOString() },
]
