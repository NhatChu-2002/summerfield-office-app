import { lazy } from 'react'

export const MeetingsPage = lazy(() => import('./pages/MeetingsPage'))
export { previewMeetings } from './preview-data'
export type { MeetingRecord } from './model'
