import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { downloadInspectionPhoto, maxPhotosPerVisit, removeInspectionPhoto, uploadInspectionPhoto, type InspectionPhoto } from '../photos'

export function PhotoEvidence({ organizationId, inspectionId, questionKey, photos, editable, onPhotos, onBusy }: {
  organizationId: string; inspectionId: string | null; questionKey: string
  photos: InspectionPhoto[]; editable: boolean; onPhotos: (photos: InspectionPhoto[]) => void; onBusy: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const urls = useRef(new Set<string>())
  const own = photos.filter((photo) => photo.question_key === questionKey)

  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)) }, [])

  async function add(event: ChangeEvent<HTMLInputElement>) {
    const selected = [...(event.target.files || [])]
    event.target.value = ''
    if (!inspectionId || !selected.length || busy) return
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
      {editable && inspectionId && <label className="vy-walk-add-photo"><Camera size={15} /> Add photo<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple disabled={busy || photos.length >= maxPhotosPerVisit} onChange={(event) => void add(event)} /></label>}
    </div>
    {!inspectionId && editable && <p>Save a draft before adding photos.</p>}
    {photos.length >= maxPhotosPerVisit && editable && <p>Photo limit reached for this visit.</p>}
    {own.length > 0 && <div className="vy-walk-photo-list">{own.map((photo) => <div className="vy-walk-photo" key={photo.photo_id}>
      {previews[photo.photo_id] ? <img src={previews[photo.photo_id]} alt={`Evidence for ${questionKey}`} /> : <button type="button" disabled={busy} onClick={() => void open(photo)}>View photo</button>}
      {editable && <button type="button" className="vy-walk-photo-remove" aria-label={`Remove photo ${photo.photo_id}`} title="Remove photo" disabled={busy} onClick={() => setConfirmRemove(photo.photo_id)}><Trash2 size={14} /></button>}
    </div>)}</div>}
    {confirmRemove && <div className="vy-walk-photo-confirm" role="group" aria-label="Confirm photo removal"><span>Remove this photo?</span><button type="button" onClick={() => setConfirmRemove(null)}>Cancel</button><button type="button" onClick={() => { const photo = own.find((item) => item.photo_id === confirmRemove); if (photo) void remove(photo) }}>Remove</button></div>}
    {busy && <p role="status">Working with photos...</p>}
    {error && <p className="vy-walk-error" role="alert">{error}</p>}
  </div>
}
