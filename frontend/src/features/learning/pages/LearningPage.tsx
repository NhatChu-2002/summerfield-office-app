import { useState } from 'react'
import { BookOpen, Plus, Search } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { LessonDraftDialog } from '../components/LessonDraftDialog'
import { filterLessons, learningSummary, type LearningProgress, type Lesson } from '../model'
import './learning.css'

const suggestedTopics: Record<string, string[]> = {
  company: ['Customer service at Summerfield', 'How our departments fit together', 'Spotting a problem early'],
  marketing: ['Reading your own analytics honestly', 'Working with creators: briefs and usage rights'],
  operations: ['Opening and closing checklists that get followed', 'Queue management at peak'],
  finance: ['Reading a store P&L', 'Vendor negotiation and price creep'],
}

export default function LearningPage({ departments, lessons, progress, preview, onLessonsChange }: {
  departments: ReferenceDepartment[]
  lessons: Lesson[]
  progress: LearningProgress
  preview: boolean
  onLessonsChange?: (lessons: Lesson[]) => void
}) {
  const [department, setDepartment] = useState('')
  const [query, setQuery] = useState('')
  const [draftTopic, setDraftTopic] = useState<string | null>(null)
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const byCode = (code: string) => allDepartments.find((item) => item.code === code) || companyDepartment
  const shown = filterLessons(lessons, department, query)
  const summary = learningSummary(lessons, progress)
  const seedDepartment = department || 'company'
  const suggestions = (suggestedTopics[seedDepartment] || []).filter((topic) => !lessons.some((lesson) => lesson.department === seedDepartment && lesson.topic.toLocaleLowerCase() === topic.toLocaleLowerCase()))

  return <>
    <header className="vy-hero vy-learning-hero"><div><h1>Learning</h1><p>Short lessons that keep everyone current across the work we do.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button vy-button-dark" disabled={!preview} title={preview ? undefined : 'Shared lesson publishing is not connected yet'} onClick={() => setDraftTopic('')}><Plus size={15} /> Write a lesson</button></div></header>
    <p className="vy-learning-status">{preview ? 'Sample lessons and your progress stay in this preview until you reload.' : 'The shared learning library and personal progress are not connected yet.'}</p>
    <div className="vy-learning-stats" aria-label="Learning summary">
      <div><strong>{preview ? summary.done : '—'}</strong><span>Lessons you have finished</span></div>
      <div><strong>{preview ? summary.total : '—'}</strong><span>In the library</span></div>
      <div><strong>{preview && summary.average !== null ? `${summary.average}%` : '—'}</strong><span>Average quiz score</span></div>
    </div>
    <div className="vy-learning-toolbar">
      <label className="vy-learning-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search lessons" placeholder="Search lessons" /></label>
      <SelectField value={department} onChange={setDepartment} ariaLabel="Team" size="compact" options={[{ value: '', label: 'Every team' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} />
    </div>
    {shown.length ? <div className="vy-learning-grid">{shown.map((lesson) => {
      const team = byCode(lesson.department)
      const finished = progress.done[lesson.id]
      const score = progress.scores[lesson.id]
      return <article className="vy-learning-card" key={lesson.id} style={departmentStyle(team.color)}>
        <div className="vy-learning-card-meta"><span className="vy-learning-team" style={departmentStyle(team.color)}>{team.name}</span><span>{lesson.minutes} min</span>{lesson.draft && <span>Preview draft</span>}</div>
        <h2>{lesson.title}</h2><p>{lesson.why || lesson.topic}</p>
        <div className="vy-learning-card-bottom"><a className={`vy-button vy-button-small ${finished ? '' : 'vy-button-dark'}`} href={`#/lesson/${encodeURIComponent(lesson.id)}`}><BookOpen size={14} /> {finished ? 'Read again' : 'Start'}</a>{finished && <span>Finished {displayDate(finished)}</span>}{score !== undefined && <strong>{score}%</strong>}</div>
      </article>
    })}</div> : <p className="vy-learning-empty">{lessons.length ? 'No lessons match these filters.' : preview ? 'No lessons in the library yet.' : 'Shared lessons will appear here when the learning service is connected.'}</p>}
    {preview && suggestions.length > 0 && <section className="vy-learning-suggestions" aria-labelledby="vy-learning-suggestions-title"><h2 id="vy-learning-suggestions-title">Worth teaching next</h2><div>{suggestions.map((topic) => <button key={topic} type="button" className="vy-learning-topic" onClick={() => setDraftTopic(topic)}>{topic}</button>)}</div></section>}
    {draftTopic !== null && <LessonDraftDialog key={`${department}-${draftTopic}`} departments={allDepartments} initialDepartment={seedDepartment} initialTopic={draftTopic} onSave={(lesson) => { onLessonsChange?.([...lessons, lesson]); setDraftTopic(null) }} onClose={() => setDraftTopic(null)} />}
  </>
}
