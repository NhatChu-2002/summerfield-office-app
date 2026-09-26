import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { Access } from '@/features/auth'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { TimeField } from '@/shared/ui/TimeField'
import { getWalkthrough, listWalkthroughStores, reopenWalkthrough, saveWalkthroughDraft, submitWalkthrough, type WalkthroughRecord, type WalkthroughStore } from '../api'
import { firstMissing, inspectionStats, inspectionSummary, readInspection, withInspection, type Finding, type InspectionForm, type ScoreValue, type SafetyValue } from '../form-model'
import { orderChannels, validVisitDate, walkthroughMessage } from '../model'
import { activeLanes, lanes, safetyItems } from '../template'
import { downloadInspectionPhoto, listInspectionPhotos, type InspectionPhoto } from '../photos'
import { inspectionReport } from '../report'
import { ChecklistSection, SafetySection } from './ChecklistSection'
import { WalkthroughReview } from './WalkthroughReview'

type Section = 'details' | 'arrival' | 'order' | 'safety' | 'review' | 'ops' | 'kiosk' | 'rd' | 'eq' | 'mkt' | 'dt'

function VisitInput({ label, value, onChange, disabled, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; disabled: boolean; placeholder?: string
}) {
  return <label>{label}<input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} maxLength={250} /></label>
}

export function WalkthroughDraft({ access, storeId, visitDate }: { access: Access; storeId: string; visitDate: string }) {
  const organizationId = access.organization.organization_id
  const [store, setStore] = useState<WalkthroughStore | null>(null)
  const [record, setRecord] = useState<WalkthroughRecord | null>(null)
  const [photos, setPhotos] = useState<InspectionPhoto[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [form, setForm] = useState<InspectionForm>(() => readInspection(null))
  const [savedForm, setSavedForm] = useState<InspectionForm>(() => readInspection(null))
  const [section, setSection] = useState<Section>('details')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)
  const [confirmAction, setConfirmAction] = useState<'submit' | 'reopen' | 'reload' | 'leave' | null>(null)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => { setError('') }, [form])

  useEffect(() => {
    if (!validVisitDate(visitDate)) { setError('Invalid visit date.'); setLoading(false); return }
    let active = true
    setLoading(true); setError(''); setSuccess(''); setPhotoError(''); setPhotos([])
    listWalkthroughStores(organizationId).then(async (stores) => {
      const selected = stores.find((item) => item.store_id === storeId) || null
      if (!active) return
      setStore(selected)
      if (!selected) return
      const saved = await getWalkthrough(organizationId, storeId, visitDate)
      if (!active) return
      setRecord(saved)
      const initial = readInspection(saved?.payload)
      setForm(initial); setSavedForm(initial)
      if (saved) listInspectionPhotos(organizationId, saved.id)
        .then((rows) => { if (active) setPhotos(rows) })
        .catch((cause: unknown) => { if (active) setPhotoError(walkthroughMessage(cause)) })
    }).catch((cause: unknown) => { if (active) setError(walkthroughMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organizationId, storeId, visitDate, reload])

  const canEdit = !!store?.can_edit && (!record || record.status === 'draft') && (!record || record.template_version === 1)
  const editable = canEdit && !busy && !photoBusy
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm)
  useEffect(() => {
    if (!dirty || !canEdit) return
    const warnOnUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const guardNavigation = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest('a[href^="#/"]')
      const href = anchor?.getAttribute('href')
      if (!href || href === window.location.hash) return
      event.preventDefault()
      event.stopPropagation()
      setPendingHref(href)
      setConfirmAction('leave')
    }
    window.addEventListener('beforeunload', warnOnUnload)
    document.addEventListener('click', guardNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnOnUnload)
      document.removeEventListener('click', guardNavigation, true)
    }
  }, [dirty, canEdit])
  const stats = inspectionStats(form)
  const sections: { key: Section; label: string }[] = [
    { key: 'details', label: 'Store details' }, { key: 'arrival', label: 'Arrival' },
    { key: 'order', label: 'Your order' }, { key: 'safety', label: 'Food safety' },
    ...activeLanes(form.meta.hasDT === 'yes').map((lane) => ({ key: lane.id as Section, label: lane.name })),
    { key: 'review', label: 'Review & actions' },
  ]
  const setMeta = (field: keyof InspectionForm['meta'], value: string) => setForm((previous) => ({ ...previous, meta: { ...previous.meta, [field]: value } }))
  const setScore = (key: string, value: ScoreValue) => setForm((previous) => ({ ...previous, scores: { ...previous.scores, [key]: { ...previous.scores[key], value } } }))
  const setScoreNote = (key: string, note: string) => setForm((previous) => ({ ...previous, scores: { ...previous.scores, [key]: { ...previous.scores[key], note } } }))
  const setSafety = (key: string, value: SafetyValue) => setForm((previous) => ({ ...previous, safety: { ...previous.safety, [key]: { ...previous.safety[key], value } } }))
  const setSafetyNote = (key: string, note: string) => setForm((previous) => ({ ...previous, safety: { ...previous.safety, [key]: { ...previous.safety[key], note } } }))
  const setFindings = (findings: Finding[]) => setForm((previous) => ({ ...previous, findings }))

  async function save(submitting = false) {
    if (!canEdit || !store || busy || photoBusy) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const payload = withInspection(record?.payload, form, store.name, visitDate)
      const saved = await saveWalkthroughDraft(organizationId, storeId, visitDate, payload, record, inspectionSummary(store.name, form), stats.score, stats.grade)
      setRecord(saved); setSavedForm(form)
      if (submitting) {
        const submitted = await submitWalkthrough(organizationId, saved)
        setRecord(submitted); setSuccess('Walk-through submitted and locked for review.')
      } else setSuccess('Draft saved.')
    } catch (cause) { setError(submitting ? `Walk-through not submitted. ${walkthroughMessage(cause)}` : walkthroughMessage(cause)) }
    finally { setBusy(false) }
  }

  async function reopen() {
    if (!record || record.status !== 'submitted' || busy) return
    setBusy(true); setError(''); setSuccess('')
    try { setRecord(await reopenWalkthrough(organizationId, record)); setSuccess('Walk-through reopened as a draft.') }
    catch (cause) { setError(walkthroughMessage(cause)) }
    finally { setBusy(false) }
  }

  function requestSubmit() {
    const missing = firstMissing(form)
    if (missing) { setSection(missing.section as Section); setError(`Complete ${missing.label} before submitting.`); setSuccess(''); return }
    setConfirmAction('submit')
  }

  function confirm() {
    const action = confirmAction
    setConfirmAction(null)
    if (action === 'submit') void save(true)
    if (action === 'reopen') void reopen()
    if (action === 'reload') setReload((value) => value + 1)
    if (action === 'leave' && pendingHref) window.location.hash = pendingHref
    setPendingHref(null)
  }

  async function exportPdf(copy: 'manager' | 'internal') {
    if (!store || busy || photoBusy) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const labels = Object.fromEntries([
        ...safetyItems.map((item, index) => [`safe:${index}`, item.label]),
        ...lanes.flatMap((lane) => lane.items.map((item, index) => [`${lane.id}:${index}`, item.label])),
      ])
      const { createInspectionPdf, downloadPdf } = await import('../pdf')
      const bytes = await createInspectionPdf(`${store.name} Store Walk-Through`, visitDate, copy, inspectionReport(store.name, visitDate, form, copy), photos, labels, downloadInspectionPhoto)
      const safeName = store.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')
      downloadPdf(bytes, `${safeName}-Walk-Through-${visitDate}-${copy}.pdf`)
      setSuccess(`${copy === 'manager' ? 'Manager' : 'Internal'} PDF downloaded.`)
    } catch (cause) { setError(walkthroughMessage(cause)) }
    finally { setBusy(false) }
  }

  return <div className="vy-walkthroughs">
    <a className="vy-walk-back" href="#/walkthroughs"><ArrowLeft size={16} /> Store walk-throughs</a>
    {loading ? <p className="vy-walk-message" role="status">Loading visit...</p> : !store ? <div className="vy-walk-empty"><h1>Visit unavailable</h1><p>{error || 'This store is not available to your account.'}</p></div> : <>
      <header className="vy-walk-head vy-walk-detail-head">
        <div><span className="vy-walk-kicker">{displayDate(visitDate, true)}</span><h1>{store.name}</h1><p>{record?.status === 'submitted' ? 'Submitted walk-through' : record ? 'Draft walk-through' : 'New walk-through'}</p></div>
        <button className="vy-walk-refresh" type="button" title="Reload visit" aria-label="Reload visit" disabled={busy} onClick={() => { if (dirty) setConfirmAction('reload'); else setReload((value) => value + 1) }}><RefreshCw size={17} /></button>
      </header>
      {record && <div className="vy-walk-record-meta"><span className={`vy-walk-status is-${record.status}`}>{record.status === 'draft' ? 'Draft' : 'Submitted'}</span><span>{record.score === null ? 'Not scored' : `${record.score} / 100${record.grade ? ` · ${record.grade}` : ''}`}</span><span>Revision {record.revision}</span></div>}
      {record && record.template_version !== 1 && <p className="vy-walk-message">This visit uses a newer template and is read-only here.</p>}
      {error && <p className="vy-walk-error" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Reload</button></p>}
      {photoError && <p className="vy-walk-error" role="alert">Photo evidence could not be loaded: {photoError}</p>}
      {success && <p className="vy-walk-success" role="status">{success}</p>}
      <div className="vy-walk-section-tabs" role="group" aria-label="Visit sections">
        {sections.map((item) => <button key={item.key} type="button" aria-pressed={section === item.key} onClick={() => setSection(item.key)}>{item.label}</button>)}
      </div>
      <div className="vy-walk-fields vy-walk-full-form">
        {section === 'details' && <section aria-label="Store details"><h2>Store details</h2><div className="vy-walk-form-grid">
          <div className="vy-walk-static-field"><span>Store</span><strong>{store.name}</strong></div>
          <div className="vy-walk-static-field"><span>Visit date</span><strong>{displayDate(visitDate, true)}</strong></div>
          <VisitInput label="Address at time of visit" value={form.meta.geo} onChange={(value) => setMeta('geo', value)} disabled={!editable} />
          <label>Arrival time<TimeField value={form.meta.time} onChange={(value) => setMeta('time', value)} disabled={!editable} /></label>
          <VisitInput label="Store manager on site" value={form.meta.mgrName} onChange={(value) => setMeta('mgrName', value)} disabled={!editable} />
          <VisitInput label="Inspected by" value={form.meta.inspectors} onChange={(value) => setMeta('inspectors', value)} disabled={!editable} />
          <label>Drive-thru<SelectField value={form.meta.hasDT} onChange={(value) => setMeta('hasDT', value)} disabled={!editable} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} /></label>
        </div></section>}
        {section === 'arrival' && <section aria-label="Arrival observations"><h2>Arrival observations</h2><div className="vy-walk-form-grid">
          <VisitInput label="Guests ahead in line" value={form.meta.queue} onChange={(value) => setMeta('queue', value)} disabled={!editable} />
          <VisitInput label="Wait to place the order" value={form.meta.waitOrder} onChange={(value) => setMeta('waitOrder', value)} disabled={!editable} placeholder="Minutes" />
          <VisitInput label="Wait for the drink" value={form.meta.waitDrink} onChange={(value) => setMeta('waitDrink', value)} disabled={!editable} placeholder="Minutes" />
          <label className="vy-walk-wide">Crew on shift<textarea value={form.meta.crew} onChange={(event) => setMeta('crew', event.target.value)} disabled={!editable} rows={4} maxLength={2000} /></label>
        </div></section>}
        {section === 'order' && <section aria-label="Your order"><h2>Your order</h2><div className="vy-walk-form-grid">
          <label>Order channel<SelectField value={form.meta.channel} onChange={(value) => setMeta('channel', value)} disabled={!editable} options={[{ value: '', label: 'Choose channel' }, ...orderChannels.map((channel) => ({ value: channel, label: channel }))]} /></label>
          <VisitInput label="Order total" value={form.meta.orderTotal} onChange={(value) => setMeta('orderTotal', value)} disabled={!editable} placeholder="$" />
          <label>Order placed at<TimeField value={form.meta.orderTime} onChange={(value) => setMeta('orderTime', value)} disabled={!editable} /></label>
          <label>Handed to you at<TimeField value={form.meta.readyTime} onChange={(value) => setMeta('readyTime', value)} disabled={!editable} /></label>
          <label className="vy-walk-wide">What you ordered<textarea value={form.meta.orderItems} onChange={(event) => setMeta('orderItems', event.target.value)} disabled={!editable} rows={4} maxLength={2000} /></label>
        </div>{form.meta.hasDT === 'yes' && <><h3>Drive-thru observations</h3><div className="vy-walk-form-grid">
          <VisitInput label="Cars ahead on arrival" value={form.meta.dtCars} onChange={(value) => setMeta('dtCars', value)} disabled={!editable} />
          <VisitInput label="Speaker to window" value={form.meta.dtSpeaker} onChange={(value) => setMeta('dtSpeaker', value)} disabled={!editable} placeholder="Seconds" />
          <VisitInput label="Window to hand-off" value={form.meta.dtWindow} onChange={(value) => setMeta('dtWindow', value)} disabled={!editable} placeholder="Seconds" />
          <VisitInput label="Total time in lane" value={form.meta.dtTotal} onChange={(value) => setMeta('dtTotal', value)} disabled={!editable} placeholder="Seconds" />
        </div></>}</section>}
        {section === 'safety' && <SafetySection form={form} editable={editable} onSafety={setSafety} onNote={setSafetyNote} organizationId={organizationId} inspectionId={record?.id || null} photos={photos} onPhotos={setPhotos} onPhotoBusy={setPhotoBusy} />}
        {activeLanes(form.meta.hasDT === 'yes').filter((lane) => lane.id === section).map((lane) => <ChecklistSection key={lane.id} lane={lane} form={form} editable={editable} onScore={setScore} onNote={setScoreNote} organizationId={organizationId} inspectionId={record?.id || null} photos={photos} onPhotos={setPhotos} onPhotoBusy={setPhotoBusy} />)}
        {section === 'review' && <><WalkthroughReview form={form} editable={editable} onMeta={setMeta} onFindings={setFindings} /><section className="vy-walk-export" aria-label="Download report"><h2>Download report</h2><div><button type="button" className="vy-button" disabled={busy || photoBusy} onClick={() => void exportPdf('manager')}>Manager PDF</button><button type="button" className="vy-button" disabled={busy || photoBusy} onClick={() => void exportPdf('internal')}>Internal PDF</button></div></section></>}
      </div>
      {canEdit && <div className="vy-walk-savebar"><span role="status">{busy || photoBusy ? 'Working...' : dirty ? 'Unsaved changes' : record ? 'All changes saved' : 'Not saved yet'}</span><button className="vy-button" type="button" disabled={busy || photoBusy || (!!record && !dirty)} onClick={() => void save()}>{busy ? 'Working...' : 'Save draft'}</button><button className="vy-button vy-button-dark" type="button" disabled={busy || photoBusy} onClick={requestSubmit}>Submit</button></div>}
      {record?.status === 'submitted' && access.organization.role === 'admin' && <div className="vy-walk-savebar"><button type="button" className="vy-button" disabled={busy} onClick={() => setConfirmAction('reopen')}>Reopen as draft</button></div>}
    </>}
    <Dialog.Root open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
      <Dialog.Portal><Dialog.Overlay className="vy-walk-dialog-overlay" /><Dialog.Content className="vy-walk-dialog"><Dialog.Title>{confirmAction === 'submit' ? 'Submit walk-through?' : confirmAction === 'reopen' ? 'Reopen walk-through?' : 'Discard unsaved changes?'}</Dialog.Title><Dialog.Description>{confirmAction === 'submit' ? 'The inspection will be read-only until an administrator reopens it.' : confirmAction === 'reopen' ? 'The submitted inspection will return to draft for editing.' : 'Your unsaved edits will be lost.'}</Dialog.Description><div><Dialog.Close asChild><button type="button" className="vy-button">Cancel</button></Dialog.Close><button type="button" className="vy-button vy-button-dark" onClick={confirm}>{confirmAction === 'submit' ? 'Submit' : confirmAction === 'reopen' ? 'Reopen' : 'Discard'}</button></div></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>
}
