import { useEffect, useRef, useState, type FormEvent } from 'react'
import { safeCatalogUrl, type CatalogRow } from '../model'

export function CatalogDialog({ row, onSave, onClose }: { row: CatalogRow; onSave: (next: CatalogRow) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const value = (key: string) => String(fields.get(key) || '').trim()
    const orderUrl = value('orderUrl')
    if (orderUrl && !safeCatalogUrl(orderUrl)) { setError('Enter an http or https order link.'); return }
    onSave({ ...row, name: value('name'), price: value('price'), specs: value('specs'), orderUrl,
      ...(row.section === 'equipment' ? { brand: value('brand'), model: value('model'), purpose: value('purpose'), quantity: value('quantity') }
        : row.section === 'smallwares' ? { purpose: value('purpose'), sku: value('sku'), vendor: value('vendor'), alternateVendor: value('alternateVendor') }
          : { sku: value('sku'), vendor: value('vendor'), pack: value('pack') }) })
  }
  return <dialog ref={dialog} className="vy-catalog-dialog" aria-labelledby="vy-catalog-dialog-title" onCancel={onClose} onClose={onClose}>
    <form onSubmit={submit}><h2 id="vy-catalog-dialog-title">{row.code || row.name}</h2><p>Sample catalog edit. This does not change the shared master file.</p>
      <div className="vy-catalog-form-grid"><label>Name<input name="name" required defaultValue={row.name} /></label>
        {row.section === 'equipment' ? <><label>Brand<input name="brand" defaultValue={row.brand} /></label><label>Model<input name="model" defaultValue={row.model} /></label><label>Where it is used<input name="purpose" defaultValue={row.purpose} /></label><label>Standard quantity<input name="quantity" inputMode="numeric" defaultValue={row.quantity} /></label></> : <>{row.section === 'smallwares' && <label>Used for<input name="purpose" defaultValue={row.purpose} /></label>}<label>SKU<input name="sku" defaultValue={row.sku} /></label><label>Vendor<input name="vendor" defaultValue={row.vendor} /></label>{row.section === 'smallwares' && <label>Alternate vendor<input name="alternateVendor" defaultValue={row.alternateVendor} /></label>}{row.section === 'supplies' && <label>Pack size<input name="pack" defaultValue={row.pack} /></label>}</>}
        <label>Unit price<input name="price" inputMode="decimal" defaultValue={row.price} /></label>
        <label>Order link<input name="orderUrl" type="url" defaultValue={row.orderUrl} placeholder="https://..." /></label></div>
      <label>{row.section === 'equipment' ? 'Specification' : 'Notes'}<textarea name="specs" rows={3} maxLength={1500} defaultValue={row.specs} /></label>
      {error && <p className="vy-catalog-error" role="alert">{error}</p>}
      <div className="vy-catalog-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save preview edit</button></div>
    </form>
  </dialog>
}
