import test from 'node:test'
import assert from 'node:assert/strict'
import { meetingLines, openMeetingActions, safeMeetingUrl, visibleMeetings } from './model.ts'

const meeting = (id, date, notes = '', actions = '') => ({ id, title: id, date, time: '', department: 'ops', projectId: '', attendees: '', agenda: '', notes, decisions: '', actions, driveUrl: '', savedBy: '' })

test('meeting lines ignore blank rows without changing content', () => {
  assert.deepEqual(meetingLines(' First action\n\n Second action  '), ['First action', 'Second action'])
})

test('meeting search includes notes and sorts newest first', () => {
  const records = [meeting('older', '2026-08-10', 'cups'), meeting('newer', '2026-09-10', 'new cups'), meeting('other', '2026-09-12', 'cups')]
  records[2].department = 'marketing'
  assert.deepEqual(visibleMeetings(records, 'CUPS', 'ops').map((item) => item.id), ['newer', 'older'])
  assert.equal(records[0].id, 'older')
})

test('action summary retains meeting source', () => {
  assert.deepEqual(openMeetingActions([meeting('review', '2026-09-10', '', 'Order cups\n\nConfirm vendor')]).map((item) => item.action), ['Order cups', 'Confirm vendor'])
})

test('only http and https meeting links are opened', () => {
  assert.equal(safeMeetingUrl('javascript:alert(1)'), '')
  assert.equal(safeMeetingUrl('https://drive.google.com/file'), 'https://drive.google.com/file')
})
