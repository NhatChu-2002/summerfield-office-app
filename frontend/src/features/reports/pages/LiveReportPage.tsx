import { useEffect, useState } from 'react'
import { ArrowLeft, RotateCcw, Save, Send } from 'lucide-react'
import type { Access } from '@/features/auth'
import { departmentStyle, referenceForDepartment } from '@/shared/config/reference-departments'
import { reportCapabilities } from '../access'
import { changeTeamReportStatus, getTeamReport, saveTeamReport, type ReportIdentity, type TeamReport } from '../api'
import { LiveReportFields } from '../components/LiveReportFields'
import { periodFromDates, periodFromToken, type LiveReportType } from '../live-period'
import { isNativeEditable, reportSections, reportSummary, type Payload } from '../live-schema'
import './reports.css'
import './live-reports.css'

function readableKey(value: string): string { return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }

function LegacyReport({ payload }: { payload: Payload }) {
  const named = payload.named && typeof payload.named === 'object' ? payload.named as Record<string, { value?: unknown }> : {}
  const entries = payload.entries && typeof payload.entries === 'object' ? payload.entries as Record<string, Record<string, unknown>[]> : {}
  const groups = Array.isArray(payload.metricGroups) ? payload.metricGroups as { index?: string; rows?: Record<string, unknown>[] }[] : []
  return <div className="vy-live-report-legacy"><p className="vy-report-locked">This report uses the inventory app's newer form layout. HQ can display it, but editing stays in inventory until that layout is converted here.</p>
    {Object.keys(named).length > 0 && <section><h2>Summary and details</h2><dl>{Object.entries(named).filter(([, field]) => field && typeof field === 'object' && String(field.value || '').trim()).map(([key, field]) => <div key={key}><dt>{readableKey(key)}</dt><dd>{String(field.value)}</dd></div>)}</dl></section>}
    {Object.entries(entries).map(([key, rows]) => <section key={key}><h2>{readableKey(key)}</h2>{Array.isArray(rows) && rows.map((row, index) => <dl key={index}>{Object.entries(row).filter(([, value]) => String(value || '').trim()).map(([field, value]) => <div key={field}><dt>{readableKey(field)}</dt><dd>{String(value)}</dd></div>)}</dl>)}</section>)}
    {groups.map((group, index) => <section key={index}><h2>Metric group {Number(group.index || index) + 1}</h2>{group.rows?.map((row, rowIndex) => <dl key={rowIndex}>{Object.entries(row).filter(([, value]) => String(value || '').trim()).map(([field, value]) => <div key={field}><dt>{readableKey(field)}</dt><dd>{String(value)}</dd></div>)}</dl>)}</section>)}
  </div>
}

export default function LiveReportPage({ access, departmentCode, reportType, periodToken, periodStart, periodEnd, storeId, returnView }: {
  access: Access; departmentCode: string; reportType: LiveReportType; periodToken: string; periodStart?: string; periodEnd?: string; storeId?: string; returnView: 'all' | 'draft' | 'submitted'
}) {
  const department = access.departments.find((item) => item.code === departmentCode)
  const period = periodEnd ? periodFromDates(reportType, periodStart || (reportType === 'monthly' ? `${periodToken}-01` : periodToken), periodEnd) : periodFromToken(reportType, periodToken)
  const store = storeId ? access.organization.stores.find((item) => item.id === storeId) : undefined
  const scopedStoreId = departmentCode === 'store_manager' ? store?.id || null : null
  const capability = reportCapabilities(access, departmentCode, scopedStoreId)
  const [report, setReport] = useState<TeamReport | null>(null)
  const [draft, setDraft] = useState<Payload>({ schema_version: 1 })
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const organizationId = access.organization.organization_id

  useEffect(() => {
    if (!period || !capability.read) { setLoading(false); return }
    let active = true
    setLoading(true)
    setError('')
    const identity: ReportIdentity = { organizationId, departmentCode, period, storeId: scopedStoreId }
    getTeamReport(identity).then((loaded) => {
      if (!active) return
      setReport(loaded)
      setDraft(loaded?.payload || { schema_version: 1 })
      setDirty(false)
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Report could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  // Identity fields, not the temporary period object, determine reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, departmentCode, reportType, period?.start, scopedStoreId, retry])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!department || !period || !capability.read || (departmentCode === 'store_manager' && !store)) return <div className="vy-report-unavailable"><h1>Report unavailable</h1><p>This report is not assigned to your account, or its period is invalid.</p><a className="vy-button" href="#/reports">All reports</a></div>
  const reference = referenceForDepartment(department)
  const identity: ReportIdentity = { organizationId, departmentCode, period, storeId: scopedStoreId }
  const editable = capability.edit && report?.status !== 'submitted' && isNativeEditable(draft)
  const summary = reportSummary(reportType, draft)

  async function save() {
    if (!editable || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const saved = await saveTeamReport(identity, draft, report?.revision || 0, summary)
      setReport(saved); setDraft(saved.payload); setDirty(false); setMessage('Draft saved.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Draft could not be saved.') }
    finally { setBusy(false) }
  }

  async function changeStatus(action: 'submit' | 'reopen') {
    if (!report || busy || dirty || (action === 'submit' && (!capability.submit || !summary)) || (action === 'reopen' && !capability.reopen)) return
    setBusy(true); setError(''); setMessage('')
    try {
      const changed = await changeTeamReportStatus(organizationId, report, action)
      setReport(changed); setDraft(changed.payload); setMessage(action === 'submit' ? 'Report submitted.' : 'Report reopened as a draft.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Report status could not be changed.') }
    finally { setBusy(false) }
  }

  return <>
    <a className="vy-report-back" href={returnView === 'all' ? '#/reports' : `#/reports?view=${returnView}`}><ArrowLeft size={15} /> Report library</a>
    <header className="vy-hero vy-report-detail-hero" style={departmentStyle(reference.color)}><div><h1>{reference.name}{store ? ` · ${store.name}` : ''}</h1><p>{reportType === 'weekly' ? 'Weekly' : 'Monthly'} report · {period.label} · {report?.status === 'submitted' ? 'Submitted' : report ? 'Draft' : 'Not started'}</p></div><div className="vy-hero-actions">
      {editable && <button type="button" className="vy-button vy-button-dark" disabled={busy || !dirty} onClick={() => void save()}><Save size={15} /> Save draft</button>}
      {report?.status === 'draft' && capability.submit && <button type="button" className="vy-button" disabled={busy || dirty || !summary} title={dirty ? 'Save your changes before submitting' : !summary ? 'Add a headline or biggest win first' : undefined} onClick={() => void changeStatus('submit')}><Send size={15} /> Submit</button>}
      {report?.status === 'submitted' && capability.reopen && <button type="button" className="vy-button" disabled={busy} onClick={() => void changeStatus('reopen')}><RotateCcw size={15} /> Reopen</button>}
    </div></header>
    {loading ? <p role="status" className="vy-report-status">Loading report...</p> : error && !report && !dirty ? <div role="alert" className="vy-report-error">Report could not be loaded: {error} <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div> : <>
      {error && <p role="alert" className="vy-report-error">{error} <button type="button" onClick={() => setRetry((value) => value + 1)}>Reload from server</button></p>}
      {message && <p role="status" className="vy-live-report-message">{message}</p>}
      {dirty && <p className="vy-report-status">Unsaved changes. Save the draft before leaving this page.</p>}
      {!report && !capability.edit ? <p className="vy-report-locked">No report has been started for this period.</p> : !isNativeEditable(draft) ? draft.version === 2 ? <LegacyReport payload={draft} /> : <p className="vy-report-locked">This report uses an unknown template version. It is read-only in HQ; no data has been changed.</p> : <><div className="vy-report-editor">{reportSections(reportType).map((section, index) => <section key={section.key} aria-label={section.title}><div className="vy-live-report-section-head"><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2><p>{section.guidance}</p></div></div><LiveReportFields section={section} code={departmentCode} type={reportType} payload={draft} disabled={!editable || busy} onChange={(value) => { setDraft(value); setDirty(true); setMessage('') }} /></section>)}</div>{editable && <div className="vy-live-report-footer"><button type="button" className="vy-button vy-button-dark" disabled={busy || !dirty} onClick={() => void save()}><Save size={15} /> Save draft</button></div>}</>}
      {report?.status === 'submitted' && <p className="vy-report-locked">Submitted reports are locked. An administrator can reopen this report for edits.</p>}
    </>}
  </>
}
