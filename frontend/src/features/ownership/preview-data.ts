import type { ContactProfile, DecisionRule, OwnershipArea } from './model'

export const previewAreas: OwnershipArea[] = [
  { id: 'sample-repairs', topic: 'Equipment breakdowns', department: 'equipment_and_maintenance', owner: 'sample-sam', backup: 'design-preview', how: 'ticket', sla: 'same day', keywords: ['ice machine', 'broken', 'repair', 'blender'], sop: '', notes: '' },
  { id: 'sample-invoices', topic: 'Vendor invoices', department: 'finance', owner: 'design-preview', backup: 'sample-avery', how: 'asana', sla: '48 hours', keywords: ['invoice', 'payment', 'vendor bill'], sop: '', notes: '' },
  { id: 'sample-social', topic: 'Social posts', department: 'marketing', owner: 'sample-avery', backup: '', how: 'message', sla: 'next business day', keywords: ['instagram', 'social', 'reel', 'post'], sop: '', notes: '' },
]

export const previewProfiles: ContactProfile[] = [
  { id: 'design-preview', title: 'HQ preview', department: 'company', phone: '', email: '', best: 'Message in HQ', hours: '', based: '', backup: 'sample-avery', notes: '' },
]

export const previewDecisions: DecisionRule[] = [
  { id: 'sample-repair', group: 'Equipment', decision: 'Approve an equipment repair', department: 'equipment_and_maintenance', decider: 'sample-sam', limit: 'up to $500', escalate: 'design-preview', consult: 'Store manager', inform: 'Operations', keywords: ['repair', 'broken', 'blender', 'ice machine'], notes: '' },
  { id: 'sample-spend', group: 'Money', decision: 'Approve a vendor invoice', department: 'finance', decider: 'design-preview', limit: 'up to $1,000', escalate: '', consult: '', inform: 'The requesting team', keywords: ['invoice', 'vendor bill', 'payment'], notes: '' },
  { id: 'sample-campaign', group: 'Marketing', decision: 'Approve a social campaign', department: 'marketing', decider: 'sample-avery', limit: 'up to $250', escalate: 'design-preview', consult: 'Marketing', inform: '', keywords: ['instagram', 'social', 'campaign', 'post'], notes: '' },
]
