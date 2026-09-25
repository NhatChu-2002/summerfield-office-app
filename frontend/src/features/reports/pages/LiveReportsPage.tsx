import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import type { Access } from '@/features/auth'
import { departmentStyle, referenceForDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import { reportCapabilities } from '../access'
import { getTeamReport, type ReportIdentity, type TeamReport } from '../api'
import { currentPeriod, periodFromToken, recentPeriods, reportHref, reportsHref, type LiveReportType } from '../live-period'
import './reports.css'
import './live-reports.css'

export default function LiveReportsPage({ access, selectedType, selectedPeriod }: { access: Access; selectedType?: LiveReportType; selectedPeriod?: string }) {
  const type = selectedType || 'monthly'
  const period = selectedPeriod ? periodFromToken(type, selectedPeriod) : currentPeriod(type)
  const [records, setRecords] = useState<Record<string, TeamReport | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const cards = access.departments.flatMap((department) => {
    const stores = department.code === 'store_manager' ? access.organization.stores : [null]
    return stores.map((store) => ({ department, store, key: `${department.code}:${store?.id || ''}` }))
      .filter(({ store }) => reportCapabilities(access, department.code, store?.id || null).read)
  })

  useEffect(() => {
    if (!period) { setLoading(false); return }
    let active = true
    setLoading(true)
    setError('')
    const identities: { key: string; identity: ReportIdentity }[] = cards.map(({ department, store, key }) => ({ key, identity: {
      organizationId: access.organization.organization_id, departmentCode: department.code, period, storeId: store?.id || null,
    } }))
    Promise.all(identities.map(async ({ key, identity }) => [key, await getTeamReport(identity)] as const))
      .then((result) => { if (active) setRecords(Object.fromEntries(result)) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Reports could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  // Card identity changes only when the signed-in organization or period changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.organization.organization_id, access.departments, access.organization.stores, type, period?.start, retry])

  if (!period) return <div className="vy-report-unavailable"><h1>Invalid report period</h1><a className="vy-button" href="#/reports">All reports</a></div>
  const loaded = Object.values(records)
  const submitted = loaded.filter((report) => report?.status === 'submitted').length
  const drafts = loaded.filter((report) => report?.status === 'draft').length
  const periods = recentPeriods(type)

  return <>
    <header className="vy-hero vy-reports-hero"><div><h1>Team reports</h1><p>Weekly commitments and monthly reviews from your teams.</p></div><div className="vy-hero-actions">
      <div className="vy-live-report-modes" role="group" aria-label="Report frequency"><a className={type === 'weekly' ? 'is-active' : ''} href={reportsHref(currentPeriod('weekly'))}>Weekly</a><a className={type === 'monthly' ? 'is-active' : ''} href={reportsHref(currentPeriod('monthly'))}>Monthly</a></div>
      <SelectField ariaLabel="Report period" value={period.start} onChange={(value) => { const next = periodFromToken(type, type === 'monthly' ? value.slice(0, 7) : value); if (next) window.location.hash = reportsHref(next) }} options={periods.map((item) => ({ value: item.start, label: item.label }))} size="compact" />
    </div></header>
    {error && <div role="alert" className="vy-report-error">Reports could not be loaded: {error} <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
    {loading ? <p role="status" className="vy-report-status">Loading team reports...</p> : !error && <>
      <div className="vy-report-totals" aria-label="Report status"><div><strong>{submitted}</strong><span>Submitted</span></div><div><strong>{drafts}</strong><span>Drafts</span></div><div><strong>{cards.length - submitted - drafts}</strong><span>Not started</span></div></div>
      <section className="vy-report-library" aria-labelledby="vy-report-library-title"><h2 id="vy-report-library-title">{period.label}</h2>
        {cards.length ? <div className="vy-report-grid">{cards.map(({ department, store, key }) => {
          const report = records[key]
          const reference = referenceForDepartment(department)
          return <article key={key} className="vy-report-card" style={departmentStyle(reference.color)}>
            <div className="vy-report-card-top"><FileText size={17} aria-hidden="true" /><span>{report?.status === 'submitted' ? 'Submitted' : report ? 'Draft' : 'Not started'}</span></div>
            <h3>{reference.name}</h3>{store && <p className="vy-live-report-store">{store.name}</p>}
            <p>{report?.summary || (report ? 'No summary yet' : 'No report for this period')}</p>
            <a className="vy-button vy-button-small vy-button-dark" href={reportHref(department.code, period, store?.id)}>{report ? 'Open report' : 'View period'}</a>
          </article>
        })}</div> : <p>No report departments or stores are assigned to your account.</p>}
      </section>
    </>}
  </>
}
