import { useEffect, useRef, useState, type FormEvent } from 'react'
import { safeFolderUrl } from '../model'

export function FolderDialog({ onSave, onClose }: { onSave: (folder: { name: string; url: string }) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') || '').trim()
    const url = safeFolderUrl(String(fields.get('url') || '').trim())
    if (!url) { setError('Enter an http or https link.'); return }
    onSave({ name, url })
  }
  return <dialog ref={dialog} className="vy-location-dialog vy-location-folder-dialog" aria-labelledby="vy-folder-dialog-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-location-folder-form" onSubmit={submit}><h2 id="vy-folder-dialog-title">Link a Drive folder</h2>
      <label>What is in it<input name="name" required placeholder="Lease and permits" /></label>
      <label>Folder link<input name="url" type="url" required placeholder="https://drive.google.com/..." /></label>
      {error && <p role="alert">{error}</p>}
      <div className="vy-location-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Link folder</button></div>
    </form>
  </dialog>
}
