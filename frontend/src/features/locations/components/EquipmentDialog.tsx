import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import type { LocationEquipment } from '../model'

export function EquipmentDialog({ locationId, equipment, onSave, onDelete, onClose }: {
  locationId: string; equipment?: LocationEquipment; onSave: (record: LocationEquipment) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [condition, setCondition] = useState<LocationEquipment['condition']>(equipment?.condition || 'good')
  const [installed, setInstalled] = useState(equipment?.installed || '')
  const [warrantyEnd, setWarrantyEnd] = useState(equipment?.warrantyEnd || '')
  useEffect(() => { dialog.current?.showModal() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const value = (key: string) => String(fields.get(key) || '').trim()
    onSave({ id: equipment?.id || crypto.randomUUID(), locationId, code: value('code'), name: value('name'), brand: value('brand'),
      model: value('model'), purpose: value('purpose'), quantity: Math.max(1, Number(value('quantity')) || 1), tag: value('tag'), serial: value('serial'),
      installed, condition, warrantyEnd, cost: Math.max(0, Number(value('cost')) || 0), notes: value('notes') })
  }

  return <dialog ref={dialog} className="vy-location-dialog" aria-labelledby="vy-equipment-dialog-title" onCancel={onClose} onClose={onClose}>
    <form className="vy-location-form" onSubmit={submit}>
      <h2 id="vy-equipment-dialog-title">{equipment ? 'Edit equipment' : 'Add equipment'}</h2>
      <div className="vy-location-form-grid">
        <label>Equipment name<input name="name" required maxLength={120} defaultValue={equipment?.name} /></label>
        <label>Catalog code<input name="code" maxLength={40} defaultValue={equipment?.code} /></label>
        <label>Brand<input name="brand" defaultValue={equipment?.brand} /></label>
        <label>Model<input name="model" defaultValue={equipment?.model} /></label>
        <label>Purpose<input name="purpose" defaultValue={equipment?.purpose} /></label>
        <label>Quantity<input name="quantity" type="number" min="1" defaultValue={equipment?.quantity || 1} /></label>
        <label>Asset tag<input name="tag" defaultValue={equipment?.tag} /></label>
        <label>Serial<input name="serial" defaultValue={equipment?.serial} /></label>
        <label>Installed<DateField value={installed} onChange={setInstalled} /></label>
        <label>Condition<SelectField value={condition} onChange={(next) => setCondition(next as LocationEquipment['condition'])} options={[{ value: 'new', label: 'New' }, { value: 'good', label: 'Good' }, { value: 'needs', label: 'Needs attention' }, { value: 'broken', label: 'Broken' }]} /></label>
        <label>Warranty ends<DateField value={warrantyEnd} onChange={setWarrantyEnd} /></label>
        <label>Unit cost<input name="cost" type="number" min="0" step="0.01" defaultValue={equipment?.cost || ''} /></label>
      </div>
      <label>Notes<textarea name="notes" rows={3} defaultValue={equipment?.notes} /></label>
      <div className="vy-location-dialog-actions">{equipment && <button type="button" className="vy-button vy-location-danger" onClick={() => { if (window.confirm(`Delete ${equipment.name}?`)) onDelete(equipment.id) }}>Delete</button>}
        <button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save equipment</button></div>
    </form>
  </dialog>
}
