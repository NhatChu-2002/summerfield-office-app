import type { PreviewPerson, PreviewRequest } from './model'

export const previewAccessPeople: PreviewPerson[] = [
  { id: 'sample-admin', name: 'Preview admin', email: 'admin@example.test', role: 'admin', departments: [] },
  { id: 'sample-manager', name: 'Preview manager', email: 'manager@example.test', role: 'manager', departments: ['operations', 'marketing'] },
  { id: 'sample-member', name: 'Preview teammate', email: 'teammate@example.test', role: 'member', departments: ['operations'] },
  { id: 'sample-viewer', name: 'Preview observer', email: 'observer@example.test', role: 'viewer', departments: [] },
]

export const previewAccessRequests: PreviewRequest[] = [
  { id: 'sample-request', name: 'Preview requester', email: 'requester@example.test', askedAt: '2026-09-23' },
]
