import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Plus, Search } from 'lucide-react'
import type { Access } from '@/features/auth'
import { referenceForDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { listTeamReportHistory, type TeamReportSummary } from '../api'
import type { ReportCursor } from '../history-cursor'
import { matchingDepartmentCodes, matchingStoreIds } from '../history-search'
import { appendHistory, historyHref, historyPeriod } from '../history-model'
import { currentPeriod, reportsHref, type LiveReportType } from '../live-period'
import './report-library.css'

type View = 'all' | 'draft' | 'submitted'
const PAGE_SIZE = 25
const views: { value: View; label: string }[] = [{ value: 'draft', label: 'Drafts' }, { value: 'submitted', label: 'Submitted' }, { value: 'all', label: 'All reports' }]

export default function ReportLibraryPage({ access, view }: { access: Access; view: View }) {
  const [type, setType] = useState<LiveReportType | ''>('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [storeId, setStoreId] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [reports, setReports] = useState<TeamReportSummary[]>([])
  const [nextCursor, setNextCursor] = useState<ReportCursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [dateSearchAvailable, setDateSearchAvailable] = useState(true)
  const [retry, setRetry] = useState(0)
  const generation = useRef(0)
  const organizationId = access.organization.organization_id
  const searchDepartmentCodes = matchingDepartmentCodes(query, access.departments.map((department) => ({
    code: department.code, labels: [referenceForDepartment(department).name],
  })))
  const searchStoreIds = matchingStoreIds(query, access.organization.stores)
  const searchCodesKey = searchDepartmentCodes.join(',')
  const searchStoresKey = searchStoreIds.join(',')

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const current = ++generation.current
    setReports([])
    setNextCursor(null)
    setLoading(true)
    setLoadingMore(false)
    setError('')
    setDateSearchAvailable(true)
    listTeamReportHistory({ organizationId, status: view === 'all' ? null : view, type: type || null, departmentCode: departmentCode || null, storeId: storeId || null, search: query, searchDepartmentCodes, searchStoreIds }, null, PAGE_SIZE)
      .then((page) => {
        if (generation.current !== current) return
        setReports(page.items)
        setNextCursor(page.nextCursor)
        setDateSearchAvailable(page.dateSearchAvailable)
      })
      .catch((cause: unknown) => { if (generation.current === current) setError(cause instanceof Error ? cause.message : 'Report history could not be loaded.') })
      .finally(() => { if (generation.current === current) setLoading(false) })
    return () => { generation.current++ }
  // The matching codes are derived from the same stable access list as the filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, view, type, departmentCode, storeId, query, searchCodesKey, searchStoresKey, retry])

  async function loadMore() {
    if (loadingMore || !nextCursor) return
    const current = generation.current
    setLoadingMore(true)
    setError('')
    try {
      const page = await listTeamReportHistory({ organizationId, status: view === 'all' ? null : view, type: type || null, departmentCode: departmentCode || null, storeId: storeId || null, search: query, searchDepartmentCodes, searchStoreIds }, nextCursor, PAGE_SIZE)
      if (generation.current !== current) return
      setReports((existing) => appendHistory(existing, page.items))
      setNextCursor(page.nextCursor)
      setDateSearchAvailable(page.dateSearchAvailable)
    } catch (cause) { if (generation.current === current) setError(cause instanceof Error ? cause.message : 'More reports could not be loaded.') }
    finally { if (generation.current === current) setLoadingMore(false) }
  }

  const stores = access.organization.stores
  return <>
    <header className="vy-report-library-head"><div><h1>Team reports</h1><p>Drafts and submitted reports across your teams.</p></div><a className="vy-button vy-button-dark" href={reportsHref(currentPeriod('monthly'))}><Plus size={16} /> Start report</a></header>
    <nav className="vy-report-library-tabs" aria-label="Report views">{views.map((item) => <a key={item.value} href={item.value === 'all' ? '#/reports' : `#/reports?view=${item.value}`} aria-current={view === item.value ? 'page' : undefined}>{item.label}</a>)}</nav>
    <div className="vy-report-library-filters">
      <label className="vy-report-library-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search report name, summary, or date</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, summary, or date" maxLength={120} /></label>
      <SelectField ariaLabel="Report type" value={type} onChange={(value) => setType(value as LiveReportType | '')} options={[{ value: '', label: 'All types' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} size="compact" />
      <SelectField ariaLabel="Department" value={departmentCode} onChange={(value) => { setDepartmentCode(value); setStoreId('') }} options={[{ value: '', label: 'All teams' }, ...access.departments.map((department) => ({ value: department.code, label: referenceForDepartment(department).name }))]} size="compact" />
      {departmentCode === 'store_manager' && <SelectField ariaLabel="Store" value={storeId} onChange={setStoreId} options={[{ value: '', label: 'All stores' }, ...stores.map((store) => ({ value: store.id, label: store.name }))]} size="compact" />}
    </div>
    {error && <div className="vy-report-error" role="alert">{error} <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
    {!dateSearchAvailable && query && <p className="vy-report-status">Date search is unavailable until this environment's report migration is applied. Name and summary search still work.</p>}
    {loading ? <p className="vy-report-status" role="status">Loading report history...</p> : <section className="vy-report-history" aria-label="Report history">
      {reports.length ? <><div className="vy-report-history-heading" aria-hidden="true"><span>Report</span><span>Summary</span><span>Status</span><span>Updated</span><span></span></div><ul>{reports.map((report) => {
        const department = access.departments.find((item) => item.code === report.department_code)
        const store = stores.find((item) => item.id === report.store_id)
        const period = historyPeriod(report)
        const href = historyHref(report, view)
        return <li key={report.id} className="vy-report-history-row"><div className="vy-report-history-identity"><strong>{department ? referenceForDepartment(department).name : report.department_code}{store ? ` · ${store.name}` : ''}</strong><span>{report.report_type === 'weekly' ? 'Weekly' : 'Monthly'} · {period?.label || `${report.period_start} - ${report.period_end}`}</span></div><p>{report.summary || 'No summary yet'}</p><span className={`vy-report-history-status is-${report.status}`}>{report.status === 'draft' ? 'Draft' : 'Submitted'}</span><time dateTime={report.updated_at}>{new Date(report.updated_at).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' })}</time>{href && <a href={href} aria-label={`Open ${department ? referenceForDepartment(department).name : report.department_code} ${report.report_type} report for ${period?.label || report.period_start}`} title="Open report"><span className="vy-report-open-label">Open report</span><ArrowUpRight size={17} /></a>}</li>
      })}</ul></> : !error && <div className="vy-report-history-empty"><h2>No reports found</h2><p>{view === 'draft' ? 'No saved drafts match these filters.' : view === 'submitted' ? 'No submitted reports match these filters.' : 'Start a weekly or monthly report to build this history.'}</p></div>}
      {nextCursor && <button type="button" className="vy-button vy-report-history-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading...' : 'Load more'}</button>}
    </section>}
  </>
}
