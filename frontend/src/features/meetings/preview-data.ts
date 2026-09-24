import type { MeetingRecord } from './model'

export const previewMeetings: MeetingRecord[] = [
  { id: 'sample-ops', title: 'Weekly operations review', date: '2026-09-22', time: '10:00', department: 'operations', projectId: '', attendees: 'Preview team', agenda: 'Store handoff\nSupply check', notes: 'The team reviewed the handoff checklist and supply counts. This is sample design content.', decisions: 'Keep the current handoff format for the next review.', actions: 'Update the handoff checklist — Preview team — 2026-09-30\nConfirm cup inventory — Preview team — 2026-09-29', driveUrl: '', savedBy: 'Preview' },
  { id: 'sample-marketing', title: 'Autumn campaign check-in', date: '2026-09-17', time: '14:30', department: 'marketing', projectId: '', attendees: 'Preview team', agenda: 'Launch calendar\nCreative review', notes: 'The team compared the draft launch calendar and creative notes. This is sample design content.', decisions: 'Review final artwork at the next check-in.', actions: 'Prepare artwork review — Preview team — 2026-09-28', driveUrl: '', savedBy: 'Preview' },
]
