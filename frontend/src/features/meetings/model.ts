export type MeetingRecord = {
  id: string
  title: string
  date: string
  time: string
  department: string
  projectId: string
  attendees: string
  agenda: string
  notes: string
  decisions: string
  actions: string
  driveUrl: string
  savedBy: string
}

export function meetingLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

export function visibleMeetings(meetings: MeetingRecord[], query: string, department: string): MeetingRecord[] {
  const needle = query.trim().toLocaleLowerCase()
  return meetings.filter((meeting) => (!department || meeting.department === department)
    && (!needle || [meeting.title, meeting.attendees, meeting.agenda, meeting.notes, meeting.decisions, meeting.actions]
      .some((value) => value.toLocaleLowerCase().includes(needle))))
    .sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`))
}

export function openMeetingActions(meetings: MeetingRecord[]): { meetingId: string; title: string; date: string; action: string }[] {
  return meetings.flatMap((meeting) => meetingLines(meeting.actions).map((action) => ({ meetingId: meeting.id, title: meeting.title, date: meeting.date, action })))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function safeMeetingUrl(value: string): string {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}
