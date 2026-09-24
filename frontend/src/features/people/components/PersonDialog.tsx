import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { PreviewPerson } from '../model'

export function PersonDialog({ person, onSave, onClose }: {
  person?: PreviewPerson
  onSave: (person: PreviewPerson) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal(); nameInput.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') || '').trim()
    if (!name) { setError('Enter a name.'); nameInput.current?.focus(); return }
    onSave({
      id: person?.id || crypto.randomUUID(), name,
      email: String(fields.get('email') || '').trim(),
      position: String(fields.get('position') || '').trim(),
      phone: String(fields.get('phone') || '').trim(),
      role: person?.role || 'member', departments: person?.departments || [],
    })
  }

  return <dialog ref={dialog} className="vy-people-dialog" aria-labelledby="vy-people-dialog-title" onCancel={onClose} onClose={onClose}>
    <form onSubmit={submit}>
      <h2 id="vy-people-dialog-title">{person ? 'Preview person details' : 'Add someone by name'}</h2>
      <p>These details stay in the Design preview and do not create an account.</p>
      <label>Name<input ref={nameInput} name="name" required maxLength={120} defaultValue={person?.name || ''} /></label>
      <label>Email<input name="email" type="email" maxLength={200} defaultValue={person?.email || ''} /></label>
      <label>Position<input name="position" maxLength={120} defaultValue={person?.position || ''} /></label>
      <label>Phone<input name="phone" type="tel" maxLength={50} defaultValue={person?.phone || ''} /></label>
      {error && <p role="alert" className="vy-people-error">{error}</p>}
      <div className="vy-people-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save in preview</button></div>
    </form>
  </dialog>
}
