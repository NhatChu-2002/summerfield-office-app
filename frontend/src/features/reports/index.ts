import { lazy } from 'react'

export const ReportsPage = lazy(() => import('./pages/ReportsPage'))
export const ReportPage = lazy(() => import('./pages/ReportPage'))
export { previewReports } from './preview-data'
export type { ReportRecord } from './model'
