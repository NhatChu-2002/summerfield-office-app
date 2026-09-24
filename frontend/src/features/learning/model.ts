export type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string }
export type Lesson = {
  id: string
  department: string
  topic: string
  title: string
  why: string
  minutes: number
  sections: { heading: string; body: string }[]
  takeaways: string[]
  watchouts: string[]
  quiz: QuizQuestion[]
  sources: string[]
  createdAt: string
  draft?: boolean
}
export type LearningProgress = { done: Record<string, string>; scores: Record<string, number> }

export function filterLessons(lessons: Lesson[], department: string, query: string) {
  const term = query.trim().toLocaleLowerCase()
  return lessons.filter((lesson) => (!department || lesson.department === department)
    && (!term || `${lesson.title} ${lesson.topic} ${lesson.why}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function learningSummary(lessons: Lesson[], progress: LearningProgress) {
  const ids = new Set(lessons.map((lesson) => lesson.id))
  const done = Object.keys(progress.done).filter((id) => ids.has(id)).length
  const scores = Object.entries(progress.scores).filter(([id]) => ids.has(id)).map(([, score]) => score)
  return { done, total: lessons.length, average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null }
}

export function scoreQuiz(questions: QuizQuestion[], picks: Record<number, number>): { right: number; total: number; percent: number } | null {
  if (!questions.length || questions.some((question, index) => !Number.isInteger(picks[index]) || picks[index] < 0 || picks[index] >= question.options.length)) return null
  const right = questions.filter((question, index) => question.answer === picks[index]).length
  return { right, total: questions.length, percent: Math.round(right / questions.length * 100) }
}
