import { lazy } from 'react'

export const WhoToAskPage = lazy(() => import('./pages/WhoToAskPage').then((module) => ({ default: module.WhoToAskPage })))
export const DecisionChartPage = lazy(() => import('./pages/DecisionChartPage').then((module) => ({ default: module.DecisionChartPage })))
export type { ContactProfile, DecisionRule, OwnershipArea, Person } from './model'
export { previewAreas, previewDecisions, previewProfiles } from './preview-data'
