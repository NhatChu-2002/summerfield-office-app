import { lazy } from 'react'

export const ReportsPage = lazy(() => import('./pages/ReportsPage'))
export const ReportPage = lazy(() => import('./pages/ReportPage'))
export const LiveReportsPage = lazy(() => import('./pages/LiveReportsPage'))
export const LiveReportPage = lazy(() => import('./pages/LiveReportPage'))
export const ReportLibraryPage = lazy(() => import('./pages/ReportLibraryPage'))
export { previewReports } from './preview-data'
export { reportCapabilities } from './access'
export { reportsHomeHref, reportsHref } from './live-period'
export { useCurrentReportPeriod } from './use-current-report-period'
export type { ReportCapabilities } from './access'
export type { ReportRecord } from './model'
