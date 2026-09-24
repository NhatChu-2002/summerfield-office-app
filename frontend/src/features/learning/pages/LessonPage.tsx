import { useState } from 'react'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { scoreQuiz, type LearningProgress, type Lesson } from '../model'
import './learning.css'

export default function LessonPage({ id, departments, lessons, progress, preview, onMarkDone, onSaveScore, onDelete }: {
  id: string
  departments: ReferenceDepartment[]
  lessons: Lesson[]
  progress: LearningProgress
  preview: boolean
  onMarkDone?: (id: string) => void
  onSaveScore?: (id: string, score: number) => void
  onDelete?: (id: string) => void
}) {
  const [picks, setPicks] = useState<Record<number, number>>({})
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz>>(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const lesson = lessons.find((item) => item.id === id)
  if (!lesson) return <div className="vy-learning-unavailable"><h1>Lesson unavailable</h1><p>{preview ? 'This lesson may have been removed from the preview.' : 'Shared lessons are not connected yet.'}</p><a className="vy-button" href="#/learn">Learning</a></div>

  const team = [companyDepartment, ...departments].find((item) => item.code === lesson.department) || companyDepartment
  const finished = progress.done[id]
  function submitQuiz() {
    const next = scoreQuiz(lesson!.quiz, picks)
    if (!next) { setError('Answer every question before checking your score.'); return }
    setError('')
    setResult(next)
    onSaveScore?.(id, next.percent)
  }

  return <>
    <a className="vy-learning-back" href="#/learn"><ArrowLeft size={15} /> Learning</a>
    <header className="vy-hero vy-lesson-hero" style={departmentStyle(team.color)}><div><h1>{lesson.title}</h1><p>{team.name} · {lesson.minutes} min{finished && ` · finished ${displayDate(finished)}`}</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" disabled={!preview || Boolean(finished)} onClick={() => onMarkDone?.(id)}><Check size={15} /> {finished ? 'Marked as read' : 'Mark as read'}</button>{preview && lesson.draft && <button type="button" className="vy-button" onClick={() => setConfirmDelete(true)} aria-label="Remove preview draft"><Trash2 size={15} /></button>}</div></header>
    {confirmDelete && <div className="vy-learning-delete" role="group" aria-label="Remove preview draft"><p>Remove this preview draft?</p><button type="button" className="vy-button" onClick={() => setConfirmDelete(false)}>Cancel</button><button type="button" className="vy-button vy-button-dark" onClick={() => { onDelete?.(id); window.location.hash = '#/learn' }}>Remove</button></div>}
    <article className="vy-lesson-content">
      {lesson.why && <p className="vy-lesson-why">{lesson.why}</p>}
      {lesson.sections.map((section, index) => <section key={`${section.heading}-${index}`}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
      {lesson.takeaways.length > 0 && <section className="vy-lesson-takeaways" style={departmentStyle(team.color)}><h2>What to do with this</h2><ul>{lesson.takeaways.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
      {lesson.watchouts.length > 0 && <section><h2>Mistakes people make</h2><ul>{lesson.watchouts.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
      {lesson.quiz.length > 0 && <section className="vy-lesson-quiz" aria-labelledby="vy-lesson-quiz-title"><h2 id="vy-lesson-quiz-title">Quick check</h2>
        {lesson.quiz.map((question, index) => <fieldset key={index}><legend>{index + 1}. {question.question}</legend>{question.options.map((option, optionIndex) => <label key={optionIndex} className={result ? optionIndex === question.answer ? 'is-right' : picks[index] === optionIndex ? 'is-wrong' : '' : ''}><input type="radio" name={`lesson-question-${index}`} checked={picks[index] === optionIndex} onChange={() => { setPicks((current) => ({ ...current, [index]: optionIndex })); setResult(null); setError('') }} />{option}</label>)}{result && <p className="vy-lesson-explanation">{question.explanation}</p>}</fieldset>)}
        {error && <p role="alert" className="vy-learning-error">{error}</p>}
        <button type="button" className="vy-button vy-button-dark" disabled={!preview} onClick={submitQuiz}>Check my answers</button>
        {result && <p className="vy-lesson-result" role="status">{result.right} of {result.total} right · {result.percent}%</p>}
      </section>}
      {lesson.sources.length > 0 && <section><h2>Check the current rule here</h2><ul>{lesson.sources.map((source, index) => <li key={index}>{source}</li>)}</ul></section>}
      <p className="vy-lesson-disclaimer">{preview ? 'Sample training content. Confirm current operating and policy details with the appropriate owner before using this as policy.' : 'Training content should be checked against current policy and source material.'}</p>
    </article>
  </>
}
