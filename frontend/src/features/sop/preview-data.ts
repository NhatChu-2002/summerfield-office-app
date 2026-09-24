import type { SopDraft } from './model'

export const previewSops: SopDraft[] = [{
  id: 'sample-store-open', status: 'draft', type: 'Checklist', department: 'operations',
  title: 'Sample opening checklist', sopNumber: '', version: '1.0', owner: 'Shift lead', appliesTo: 'Store opening team',
  effectiveDate: '', reviewDate: '', purpose: 'Make the opening handoff consistent. This is sample design content.',
  scope: 'Before the store opens', roles: [{ role: 'Shift lead', owns: 'Verify the opening checklist' }],
  steps: [
    { text: 'Review the prior shift notes', owner: 'Shift lead', timing: 'Before opening', evidence: '' },
    { text: 'Check the opening supplies', owner: 'Opening team', timing: 'Before opening', evidence: '' },
    { text: '', owner: '', timing: '', evidence: '' },
  ],
  escalation: '', related: [''], approvals: [{ role: '', name: '', date: '' }],
  history: [{ version: '1.0', date: '2026-09-24', change: 'Sample preview draft', by: 'Preview' }],
  referenceText: '', filedUrl: '', updatedAt: '2026-09-24T12:00:00Z',
}]
