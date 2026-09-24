import { lazy } from 'react'

export const LearningPage = lazy(() => import('./pages/LearningPage'))
export const LessonPage = lazy(() => import('./pages/LessonPage'))
export { previewLessons } from './preview-data'
export type { Lesson, LearningProgress } from './model'
