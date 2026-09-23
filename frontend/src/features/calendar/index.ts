import { lazy } from 'react'

// The calendar pulls in FullCalendar, so it loads in its own chunk the first time it opens.
export const CalendarPage = lazy(() => import('./pages/CalendarPage'))
export type { CalendarDraft } from './model'
