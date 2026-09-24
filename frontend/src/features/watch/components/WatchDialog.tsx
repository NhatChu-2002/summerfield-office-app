import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { todayLocal } from '@/shared/lib/format'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { safeWatchUrl, type WatchDraft, type WatchKind } from '../model'

export function WatchDialog({ departments, initial, editing, onSave, onClose }: {
  departments: ReferenceDepartment[]
  initial?: Partial<WatchDraft>
  editing: boolean
  onSave: (draft: WatchDraft) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
    titleInput.current?.focus()
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const value = (name: string) => String(fields.get(name) || '').trim()
    const title = value('title')
    if (!title) { setError('Enter a title.'); titleInput.current?.focus(); return }
    const url = value('url')
    if (url && !safeWatchUrl(url)) { setError('Enter an http or https link.'); return }
    onSave({
      title, kind: value('kind') as WatchKind, department: value('department'),
      date: value('date'), source: value('source'), url, summary: value('summary'),
      lesson: value('lesson'), sourceId: initial?.sourceId,
    })
  }

  return <dialog ref={dialog} className="vy-watch-dialog" aria-labelledby="vy-watch-dialog-title" onClose={onClose} onCancel={onClose}>
    <form onSubmit={submit} className="vy-watch-form">
      <div className="vy-watch-dialog-head"><h2 id="vy-watch-dialog-title">{editing ? 'Edit Market watch item' : 'Save to Market watch'}</h2><button type="button" className="vy-icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <p>Say what it is and what we take from it. That is the part people read.</p>
      <div className="vy-watch-form-grid">
        <label>What is it<input ref={titleInput} name="title" required maxLength={180} defaultValue={initial?.title || ''} /></label>
        <label>Type<select name="kind" defaultValue={initial?.kind || 'note'}><option value="alert">Industry or competitor news</option><option value="review">A review of one of our stores</option><option value="note">Something we spotted ourselves</option></select></label>
        <label>Who should see it<select name="department" defaultValue={initial?.department || 'company'}><option value="company">Company-wide</option>{departments.filter((item) => item.code !== 'company').map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <label>Date<input name="date" type="date" required defaultValue={initial?.date || todayLocal()} /></label>
        <label>Where it came from<input name="source" maxLength={180} defaultValue={initial?.source || ''} /></label>
        <label>Link<input name="url" type="url" placeholder="https://" defaultValue={initial?.url || ''} /></label>
        <label>In a sentence or two<textarea name="summary" maxLength={1200} rows={4} defaultValue={initial?.summary || ''} /></label>
        <label>What we take from it<textarea name="lesson" maxLength={600} rows={4} placeholder="Worth copying, worth watching, or a risk to us" defaultValue={initial?.lesson || ''} /></label>
      </div>
      {error && <p className="vy-watch-form-error" role="alert">{error}</p>}
      <div className="vy-watch-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save</button></div>
    </form>
  </dialog>
}
