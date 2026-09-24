import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { locationStatuses, type LocationRecord, type LocationStatus } from '../model'

export function LocationDialog({ location, onSave, onDelete, onClose }: {
  location?: LocationRecord; onSave: (record: LocationRecord) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const name = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<LocationStatus>(location?.status || 'build')
  const [opened, setOpened] = useState(location?.opened || '')
  useEffect(() => { dialog.current?.showModal(); name.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const value = (key: string) => String(fields.get(key) || '').trim()
    if (!value('name')) { name.current?.focus(); return }
    onSave({ id: location?.id || crypto.randomUUID(), name: value('name'), code: value('code'), address: value('address'), city: value('city'),
      status, opened, sqft: value('sqft'), rent: value('rent'), landlord: value('landlord'), notes: value('notes'),
      contacts: location?.contacts || [], folders: location?.folders || [], projectIds: location?.projectIds || [] })
  }

  return <dialog ref={dialog} className="vy-location-dialog" aria-labelledby="vy-location-dialog-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-location-form" onSubmit={submit}>
      <h2 id="vy-location-dialog-title">{location ? 'Edit location' : 'Add a location'}</h2>
      <div className="vy-location-form-grid">
        <label>Location name<input ref={name} name="name" required maxLength={120} defaultValue={location?.name} placeholder="La Habra" /></label>
        <label>Store code<input name="code" maxLength={24} defaultValue={location?.code} /></label>
        <label>Street address<input name="address" maxLength={180} defaultValue={location?.address} /></label>
        <label>City<input name="city" maxLength={100} defaultValue={location?.city} /></label>
        <label>Status<SelectField value={status} onChange={(next) => setStatus(next as LocationStatus)} options={locationStatuses} /></label>
        <label>Opening date<DateField value={opened} onChange={setOpened} /></label>
        <label>Size (sq ft)<input name="sqft" inputMode="numeric" defaultValue={location?.sqft} /></label>
        <label>Monthly rent<input name="rent" inputMode="decimal" defaultValue={location?.rent} /></label>
        <label className="vy-location-wide">Landlord / property contact<input name="landlord" defaultValue={location?.landlord} /></label>
      </div>
      <label>Anything worth knowing<textarea name="notes" rows={4} maxLength={1200} defaultValue={location?.notes} /></label>
      <div className="vy-location-dialog-actions">{location && <button type="button" className="vy-button vy-location-danger" onClick={() => { if (window.confirm(`Delete ${location.name}?`)) onDelete(location.id) }}>Delete</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save location</button></div>
    </form>
  </dialog>
}
