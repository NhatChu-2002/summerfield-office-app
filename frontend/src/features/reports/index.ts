import { lazy } from 'react'

export const ReportsPage = lazy(() => import('./pages/ReportsPage'))
export const ReportPage = lazy(() => import('./pages/ReportPage'))
export { previewReports } from './preview-data'
export { reportCapabilities } from './access'
export type { ReportCapabilities } from './access'
export type { ReportRecord } from './model'
