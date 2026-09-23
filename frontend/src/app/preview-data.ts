// Sample records for Design preview only. They live in memory and are never sent anywhere.
import { todayLocal } from '@/shared/lib/format'
import type { HqTask, PeopleNames, Person } from '@/features/tasks'

export const PREVIEW_USER = 'design-preview'
export const previewPeople: Person[] = [
  { user_id: PREVIEW_USER, display_name: 'Preview' },
  { user_id: 'sample-avery', display_name: 'Avery Lee' },
  { user_id: 'sample-sam', display_name: 'Sam Park' },
]
export const previewNames: PeopleNames = Object.fromEntries(previewPeople.map((person) => [person.user_id, person.display_name]))

const shift = (days: number) => {
  const date = new Date(`${todayLocal()}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

let sequence = 0
export function previewTask(fields: Partial<HqTask> & Pick<HqTask, 'title' | 'department_code'>): HqTask {
  const now = new Date().toISOString()
  return {
    id: `preview-${++sequence}`, organization_id: 'design-preview', details: '', due_date: null, status: 'open',
    assigned_to: PREVIEW_USER, created_by: PREVIEW_USER, revision: 1, completed_at: null, created_at: now, updated_at: now, ...fields,
  }
}

export function previewTasks(): HqTask[] {
  return [
    previewTask({ title: 'Order fall cup sleeves', department_code: 'marketing', due_date: shift(-3), created_by: 'sample-avery', details: 'Match the fall launch artwork. Ask Design for the final files.' }),
    previewTask({ title: 'Review September payroll', department_code: 'finance', due_date: shift(0) }),
    previewTask({ title: 'Walk the new store site', department_code: 'build_out', due_date: shift(3), created_by: 'sample-sam' }),
    previewTask({ title: 'Plan the holiday menu tasting', department_code: 'research_and_development', due_date: shift(12) }),
    previewTask({ title: 'Refresh the opening checklist', department_code: 'operations' }),
    previewTask({ title: 'Send the vendor invoices', department_code: 'finance', status: 'done', due_date: shift(-1), completed_at: new Date().toISOString() }),
    previewTask({ title: 'Photograph the new drinks', department_code: 'design', due_date: shift(5), assigned_to: 'sample-avery' }),
  ]
}
