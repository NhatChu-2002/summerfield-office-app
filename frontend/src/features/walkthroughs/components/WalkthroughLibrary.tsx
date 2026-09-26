import { useEffect, useRef, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import type { Access } from '@/features/auth'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { listWalkthroughPage, listWalkthroughStores, type WalkthroughCursor, type WalkthroughStore, type WalkthroughSummary } from '../api'
import { walkthroughMessage } from '../model'

const updatedLabel = (value: string) => new Date(value).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' })

export function WalkthroughLibrary({ access }: { access: Access }) {
  const organizationId = access.organization.organization_id
  const [stores, setStores] = useState<WalkthroughStore[]>([])
  const [storeId, setStoreId] = useState('')
  const [status, setStatus] = useState<'draft' | 'submitted' | ''>('')
  const [rows, setRows] = useState<WalkthroughSummary[]>([])
  const [cursor, setCursor] = useState<WalkthroughCursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [storesError, setStoresError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const generation = useRef(0)

  useEffect(() => {
    let active = true
    setStoresError('')
    listWalkthroughStores(organizationId)
      .then((result) => { if (active) setStores(result) })
      .catch((cause: unknown) => { if (active) setStoresError(walkthroughMessage(cause)) })
    return () => { active = false }
  }, [organizationId, refresh])

  useEffect(() => {
    const current = ++generation.current
    setRows([]); setCursor(null); setLoading(true); setLoadingMore(false); setError('')
    listWalkthroughPage(organizationId, { storeId: storeId || undefined, status: status || undefined }, null)
      .then((page) => { if (generation.current === current) { setRows(page.items); setCursor(page.nextCursor) } })
      .catch((cause: unknown) => { if (generation.current === current) setError(walkthroughMessage(cause)) })
      .finally(() => { if (generation.current === current) setLoading(false) })
    return () => { generation.current++ }
  }, [organizationId, storeId, status, refresh])

  async function loadMore() {
    if (!cursor || loadingMore) return
    const current = generation.current
    setLoadingMore(true); setError('')
    try {
      const page = await listWalkthroughPage(organizationId, { storeId: storeId || undefined, status: status || undefined }, cursor)
      if (generation.current !== current) return
      setRows((existing) => {
        const seen = new Set(existing.map((item) => item.inspection_id))
        return [...existing, ...page.items.filter((item) => !seen.has(item.inspection_id))]
      })
      setCursor(page.nextCursor)
    } catch (cause) { if (generation.current === current) setError(walkthroughMessage(cause)) }
    finally { if (generation.current === current) setLoadingMore(false) }
  }

  return <div className="vy-walkthroughs">
    <header className="vy-walk-head">
      <div><h1>Store walk-throughs</h1><p>Visits across the stores you can access.</p></div>
      {stores.some((store) => store.can_edit) && <a className="vy-button vy-button-dark" href="#/walkthroughs/new"><Plus size={16} /> New walk-through</a>}
    </header>
    <div className="vy-walk-toolbar">
      <div className="vy-walk-tabs" role="group" aria-label="Walk-through status">
        {([['', 'All'], ['draft', 'Drafts'], ['submitted', 'Submitted']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{label}</button>)}
      </div>
      <div className="vy-walk-filters">
        {stores.length > 1 && <SelectField ariaLabel="Store" value={storeId} onChange={setStoreId} options={[{ value: '', label: 'All stores' }, ...stores.map((store) => ({ value: store.store_id, label: store.name }))]} size="compact" />}
        <button className="vy-walk-refresh" type="button" aria-label="Refresh walk-throughs" title="Refresh walk-throughs" disabled={loading} onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={17} /></button>
      </div>
    </div>
    {storesError && <p className="vy-walk-error" role="alert">Stores: {storesError}</p>}
    {error && <p className="vy-walk-error" role="alert">{error}</p>}
    {loading ? <p className="vy-walk-message" role="status">Loading walk-throughs...</p> : rows.length ? <>
      <div className="vy-walk-list-head" aria-hidden="true"><span>Visit</span><span>Summary</span><span>Status</span><span>Updated</span></div>
      <ul className="vy-walk-list">{rows.map((row) => {
        const store = stores.find((item) => item.store_id === row.store_id)
        return <li key={row.inspection_id}><a className="vy-list-row-link vy-walk-row" href={`#/walkthroughs/${encodeURIComponent(row.store_id)}/${row.visit_date}`}>
          <span className="vy-walk-identity"><strong>{store?.name || 'Store visit'}</strong><small>{displayDate(row.visit_date, true)}{row.photo_count ? ` · ${row.photo_count} photos` : ''}</small></span>
          <span className="vy-walk-summary">{row.summary || (row.score === null ? 'Visit in progress' : `${row.score} / 100${row.grade ? ` · ${row.grade}` : ''}`)}</span>
          <span className={`vy-walk-status is-${row.status}`}>{row.status === 'draft' ? 'Draft' : 'Submitted'}</span>
          <time dateTime={row.updated_at}>{updatedLabel(row.updated_at)}</time>
        </a></li>
      })}</ul>
      {cursor && <button type="button" className="vy-button vy-walk-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading...' : 'Load more visits'}</button>}
    </> : !error && <div className="vy-walk-empty"><h2>No walk-throughs found</h2><p>{status || storeId ? 'No visits match these filters.' : 'Saved visits will appear here.'}</p></div>}
  </div>
}
