import { lazy } from 'react'

export const SopPage = lazy(() => import('./pages/SopPage'))
export { previewSops } from './preview-data'
export type { SopDraft } from './model'
