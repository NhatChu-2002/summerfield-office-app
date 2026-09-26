import { lazy } from 'react'

export const TicketsPage = lazy(() => import('./pages/TicketsPage'))
export { canSubmitTicket } from './model'
