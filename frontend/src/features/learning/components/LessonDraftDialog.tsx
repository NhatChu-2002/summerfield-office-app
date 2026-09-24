import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import type { Lesson } from '../model'

export function LessonDraftDialog({ departments, initialDepartment, initialTopic, onSave, onClose }: {
  departments: ReferenceDepartment[]
  initialDepartment: string
  initialTopic: string
  onSave: (lesson: Lesson) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(initialDepartment)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal(); titleInput.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') || '').trim()
    const body = String(data.get('body') || '').trim()
    if (!title || !body) { setError('Add a title and lesson text.'); return }
    const minutes = Math.min(30, Math.max(1, Number(data.get('minutes')) || 5))
    onSave({ id: crypto.randomUUID(), department, topic: String(data.get('topic') || '').trim() || title,
      title, why: String(data.get('why') || '').trim(), minutes,
      sections: [{ heading: 'The essentials', body }],
      takeaways: String(data.get('takeaways') || '').split('\n').map((line) => line.trim()).filter(Boolean),
      watchouts: [], quiz: [], sources: [], createdAt: new Date().toISOString(), draft: true })
  }

  return <dialog ref={dialog} className="vy-learning-dialog" aria-labelledby="vy-learning-dialog-title" onCancel={onClose} onClose={onClose}>
    <form onSubmit={submit} className="vy-learning-form">
      <h2 id="vy-learning-dialog-title">New preview lesson</h2>
      <p>This draft stays in Design preview until you reload. Shared publishing and AI writing are not connected.</p>
      <div className="vy-learning-form-grid">
        <label>Team<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Reading time (minutes)<input type="number" name="minutes" min={1} max={30} defaultValue={5} /></label>
      </div>
      <label>Topic<input name="topic" maxLength={120} defaultValue={initialTopic} placeholder="What should the team learn?" /></label>
      <label>Title<input ref={titleInput} name="title" required maxLength={120} defaultValue={initialTopic} /></label>
      <label>Why this matters<input name="why" maxLength={240} placeholder="One sentence for the team" /></label>
      <label>Lesson text<textarea name="body" rows={5} required maxLength={4000} /></label>
      <label>What to do with this <small>One action per line</small><textarea name="takeaways" rows={3} maxLength={1200} /></label>
      {error && <p className="vy-learning-error" role="alert">{error}</p>}
      <div className="vy-learning-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Add preview lesson</button></div>
    </form>
  </dialog>
}
