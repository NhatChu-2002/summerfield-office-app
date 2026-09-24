import { lazy } from 'react'

export const WatchPage = lazy(() => import('./pages/WatchPage'))
export type { WatchItem } from './model'
