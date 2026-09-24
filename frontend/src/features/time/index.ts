import { lazy } from 'react'

export const TimePage = lazy(() => import('./pages/TimePage'))
export { previewTimeEntries, previewTimeCorrections } from './preview-data'
export type { TimeEntry, TimeCorrection } from './model'
