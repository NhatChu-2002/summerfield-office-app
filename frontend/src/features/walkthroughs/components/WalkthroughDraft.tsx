import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { Access } from '@/features/auth'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { TimeField } from '@/shared/ui/TimeField'
import { getWalkthrough, listWalkthroughStores, saveWalkthroughDraft, type WalkthroughRecord, type WalkthroughStore } from '../api'
import { orderChannels, readVisitMeta, validVisitDate, withVisitMeta, walkthroughMessage, type VisitMeta } from '../model'

type Section = 'details' | 'arrival' | 'order'

function VisitInput({ label, value, onChange, disabled, type = 'text', placeholder }: {
  label: string; value: string; onChange: (value: string) => void; disabled: boolean; type?: string; placeholder?: string
}) {
  return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} maxLength={250} /></label>
}

export function WalkthroughDraft({ access, storeId, visitDate }: { access: Access; storeId: string; visitDate: string }) {
  const organizationId = access.organization.organization_id
  const [store, setStore] = useState<WalkthroughStore | null>(null)
  const [record, setRecord] = useState<WalkthroughRecord | null>(null)
  const [meta, setMeta] = useState<VisitMeta>(() => readVisitMeta(null))
  const [savedMeta, setSavedMeta] = useState<VisitMeta>(() => readVisitMeta(null))
  const [section, setSection] = useState<Section>('details')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!validVisitDate(visitDate)) { setError('Invalid visit date.'); setLoading(false); return }
    let active = true
    setLoading(true); setError(''); setSuccess('')
    listWalkthroughStores(organizationId).then(async (stores) => {
      const selected = stores.find((item) => item.store_id === storeId) || null
      if (!active) return
      setStore(selected)
      if (!selected) return
      const saved = await getWalkthrough(organizationId, storeId, visitDate)
      if (!active) return
      setRecord(saved)
      const initial = readVisitMeta(saved?.payload)
      setMeta(initial); setSavedMeta(initial)
    }).catch((cause: unknown) => { if (active) setError(walkthroughMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organizationId, storeId, visitDate, reload])

  const editable = !!store?.can_edit && (!record || record.status === 'draft') && (!record || record.template_version === 1)
  const dirty = JSON.stringify(meta) !== JSON.stringify(savedMeta)
  const setField = (field: keyof VisitMeta, value: string) => setMeta((previous) => ({ ...previous, [field]: value }))

  async function save() {
    if (!editable || !store || busy) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const payload = withVisitMeta(record?.payload, meta, store.name, visitDate)
      const saved = await saveWalkthroughDraft(organizationId, storeId, visitDate, payload, record, `${store.name} | Draft visit`)
      setRecord(saved); setSavedMeta(meta); setSuccess('Draft saved.')
    } catch (cause) { setError(walkthroughMessage(cause)) }
    finally { setBusy(false) }
  }

  return <div className="vy-walkthroughs">
    <a className="vy-walk-back" href="#/walkthroughs"><ArrowLeft size={16} /> Store walk-throughs</a>
    {loading ? <p className="vy-walk-message" role="status">Loading visit...</p> : !store ? <div className="vy-walk-empty"><h1>Visit unavailable</h1><p>{error || 'This store is not available to your account.'}</p></div> : <>
      <header className="vy-walk-head vy-walk-detail-head">
        <div><span className="vy-walk-kicker">{displayDate(visitDate, true)}</span><h1>{store.name}</h1><p>{record?.status === 'submitted' ? 'Submitted walk-through' : record ? 'Draft walk-through' : 'New walk-through'}</p></div>
        <button className="vy-walk-refresh" type="button" title="Reload visit" aria-label="Reload visit" onClick={() => setReload((value) => value + 1)}><RefreshCw size={17} /></button>
      </header>
      {record && <div className="vy-walk-record-meta"><span className={`vy-walk-status is-${record.status}`}>{record.status === 'draft' ? 'Draft' : 'Submitted'}</span><span>{record.score === null ? 'Not scored' : `${record.score} / 100${record.grade ? ` · ${record.grade}` : ''}`}</span><span>Revision {record.revision}</span></div>}
      {record && record.template_version !== 1 && <p className="vy-walk-message">This visit uses a newer template and is read-only here.</p>}
      {error && <p className="vy-walk-error" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Reload</button></p>}
      {success && <p className="vy-walk-success" role="status">{success}</p>}
      <div className="vy-walk-section-tabs" role="group" aria-label="Visit sections">
        {([['details', 'Store details'], ['arrival', 'Arrival'], ['order', 'Your order']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={section === value} onClick={() => setSection(value)}>{label}</button>)}
      </div>
      <div className="vy-walk-fields">
        {section === 'details' && <section aria-label="Store details">
          <h2>Store details</h2>
          <div className="vy-walk-form-grid">
            <div className="vy-walk-static-field"><span>Store</span><strong>{store.name}</strong></div>
            <div className="vy-walk-static-field"><span>Visit date</span><strong>{displayDate(visitDate, true)}</strong></div>
            <VisitInput label="Address at time of visit" value={meta.geo} onChange={(value) => setField('geo', value)} disabled={!editable} />
            <label>Arrival time<TimeField value={meta.time} onChange={(value) => setField('time', value)} disabled={!editable} /></label>
            <VisitInput label="Store manager on site" value={meta.mgrName} onChange={(value) => setField('mgrName', value)} disabled={!editable} />
            <VisitInput label="Inspected by" value={meta.inspectors} onChange={(value) => setField('inspectors', value)} disabled={!editable} />
            <label>Drive-thru<SelectField value={meta.hasDT} onChange={(value) => setField('hasDT', value)} disabled={!editable} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} /></label>
          </div>
        </section>}
        {section === 'arrival' && <section aria-label="Arrival observations">
          <h2>Arrival observations</h2>
          <div className="vy-walk-form-grid">
            <VisitInput label="Guests ahead in line" value={meta.queue} onChange={(value) => setField('queue', value)} disabled={!editable} />
            <VisitInput label="Wait to place the order" value={meta.waitOrder} onChange={(value) => setField('waitOrder', value)} disabled={!editable} placeholder="Minutes" />
            <VisitInput label="Wait for the drink" value={meta.waitDrink} onChange={(value) => setField('waitDrink', value)} disabled={!editable} placeholder="Minutes" />
            <label className="vy-walk-wide">Crew on shift<textarea value={meta.crew} onChange={(event) => setField('crew', event.target.value)} disabled={!editable} rows={4} maxLength={2000} /></label>
          </div>
        </section>}
        {section === 'order' && <section aria-label="Your order">
          <h2>Your order</h2>
          <div className="vy-walk-form-grid">
            <label>Order channel<SelectField value={meta.channel} onChange={(value) => setField('channel', value)} disabled={!editable} options={[{ value: '', label: 'Choose channel' }, ...orderChannels.map((channel) => ({ value: channel, label: channel }))]} /></label>
            <VisitInput label="Order total" value={meta.orderTotal} onChange={(value) => setField('orderTotal', value)} disabled={!editable} placeholder="$" />
            <label>Order placed at<TimeField value={meta.orderTime} onChange={(value) => setField('orderTime', value)} disabled={!editable} /></label>
            <label>Handed to you at<TimeField value={meta.readyTime} onChange={(value) => setField('readyTime', value)} disabled={!editable} /></label>
            <label className="vy-walk-wide">What you ordered<textarea value={meta.orderItems} onChange={(event) => setField('orderItems', event.target.value)} disabled={!editable} rows={4} maxLength={2000} /></label>
          </div>
          {meta.hasDT === 'yes' && <><h3>Drive-thru observations</h3><div className="vy-walk-form-grid">
            <VisitInput label="Cars ahead on arrival" value={meta.dtCars} onChange={(value) => setField('dtCars', value)} disabled={!editable} />
            <VisitInput label="Speaker to window" value={meta.dtSpeaker} onChange={(value) => setField('dtSpeaker', value)} disabled={!editable} placeholder="Seconds" />
            <VisitInput label="Window to hand-off" value={meta.dtWindow} onChange={(value) => setField('dtWindow', value)} disabled={!editable} placeholder="Seconds" />
            <VisitInput label="Total time in lane" value={meta.dtTotal} onChange={(value) => setField('dtTotal', value)} disabled={!editable} placeholder="Seconds" />
          </div></>}
        </section>}
      </div>
      {editable && <div className="vy-walk-savebar"><span role="status">{busy ? 'Saving...' : dirty ? 'Unsaved changes' : record ? 'All changes saved' : 'Not saved yet'}</span><button className="vy-button vy-button-dark" type="button" disabled={busy || (!!record && !dirty)} onClick={() => void save()}>{busy ? 'Saving...' : 'Save draft'}</button></div>}
    </>}
  </div>
}
