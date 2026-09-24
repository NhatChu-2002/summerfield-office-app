import { lazy } from 'react'

export const PeoplePage = lazy(() => import('./pages/PeoplePage'))
export { previewAccessPeople, previewAccessRequests } from './preview-data'
export type { PreviewPerson, PreviewRequest } from './model'
