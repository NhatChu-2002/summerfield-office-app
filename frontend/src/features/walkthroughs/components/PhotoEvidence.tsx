import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Images, Trash2 } from 'lucide-react'
import { downloadInspectionPhoto, maxPhotosPerVisit, removeInspectionPhoto, uploadInspectionPhoto, type InspectionPhoto } from '../photos'

export function PhotoEvidence({ organizationId, inspectionId, questionKey, questionLabel, photos, canEdit, editable, onPhotos, onBusy }: {
  organizationId: string; inspectionId: string | null; questionKey: string; questionLabel: string
  photos: InspectionPhoto[]; canEdit: boolean; editable: boolean; onPhotos: (photos: InspectionPhoto[]) => void; onBusy: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const urls = useRef(new Set<string>())
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const own = photos.filter((photo) => photo.question_key === questionKey)
  const canAdd = editable && !!inspectionId && !busy && photos.length < maxPhotosPerVisit

  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)) }, [])

  async function add(event: ChangeEvent<HTMLInputElement>) {
    const selected = [...(event.target.files || [])]
    event.target.value = ''
    if (!inspectionId || !editable || !selected.length || busy) return
    setBusy(true); onBusy(true); setError('')
    let current = photos
    try {
      for (const file of selected) current = await uploadInspectionPhoto(organizationId, inspectionId, questionKey, file, current)
      onPhotos(current)
    } catch (cause) {
      onPhotos(current)
      setError(cause instanceof Error ? cause.message : 'Photo could not be saved.')
    } finally { setBusy(false); onBusy(false) }
  }

  async function open(photo: InspectionPhoto) {
    if (previews[photo.photo_id] || busy) return
    setBusy(true); onBusy(true); setError('')
    try {
      const blob = await downloadInspectionPhoto(photo)
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      setPreviews((previous) => ({ ...previous, [photo.photo_id]: url }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Photo could not be loaded.') }
    finally { setBusy(false); onBusy(false) }
  }

  async function remove(photo: InspectionPhoto) {
    if (!inspectionId || busy) return
    setConfirmRemove(null)
    setBusy(true); onBusy(true); setError('')
    try { onPhotos(await removeInspectionPhoto(organizationId, inspectionId, photo)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Photo could not be removed.') }
    finally { setBusy(false); onBusy(false) }
  }

  return <div className="vy-walk-evidence">
    <div className="vy-walk-evidence-bar"><strong>Photo evidence {own.length ? `(${own.length})` : ''}</strong>
      {canEdit && inspectionId && <div className="vy-walk-evidence-actions">
        <button type="button" className="vy-walk-photo-action" disabled={!canAdd} onClick={() => cameraInput.current?.click()}><Camera size={16} /> Take photo</button>
        <button type="button" className="vy-walk-photo-action" disabled={!canAdd} onClick={() => libraryInput.current?.click()}><Images size={16} /> Choose photos</button>
        <input ref={cameraInput} className="vy-walk-file-input" type="file" accept="image/*" capture="environment" aria-hidden="true" tabIndex={-1} onChange={(event) => void add(event)} />
        <input ref={libraryInput} className="vy-walk-file-input" type="file" accept="image/*" multiple aria-hidden="true" tabIndex={-1} onChange={(event) => void add(event)} />
      </div>}
    </div>
    {!inspectionId && canEdit && <p>Save a draft before adding photos.</p>}
    {photos.length >= maxPhotosPerVisit && canEdit && <p>Photo limit reached for this visit.</p>}
    {own.length > 0 && <div className="vy-walk-photo-list">{own.map((photo) => <div className="vy-walk-photo" key={photo.photo_id}>
      {previews[photo.photo_id] ? <img src={previews[photo.photo_id]} alt={`Evidence for ${questionLabel}`} /> : <button type="button" disabled={busy} onClick={() => void open(photo)}>View photo</button>}
      {canEdit && <button type="button" className="vy-walk-photo-remove" aria-label={`Remove photo ${photo.photo_id}`} title="Remove photo" disabled={!editable || busy} onClick={() => setConfirmRemove(photo.photo_id)}><Trash2 size={14} /></button>}
    </div>)}</div>}
    {confirmRemove && <div className="vy-walk-photo-confirm" role="group" aria-label="Confirm photo removal"><span>Remove this photo?</span><button type="button" onClick={() => setConfirmRemove(null)}>Cancel</button><button type="button" onClick={() => { const photo = own.find((item) => item.photo_id === confirmRemove); if (photo) void remove(photo) }}>Remove</button></div>}
    {busy && <p role="status">Working with photos...</p>}
    {error && <p className="vy-walk-error" role="alert">{error}</p>}
  </div>
}
