import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Access } from '@/features/auth'
import { DateField } from '@/shared/ui/DateField'
import { SelectField } from '@/shared/ui/SelectField'
import { listWalkthroughStores, type WalkthroughStore } from '../api'
import { todayInLosAngeles, validVisitDate, walkthroughMessage } from '../model'

export function WalkthroughStart({ access }: { access: Access }) {
  const [stores, setStores] = useState<WalkthroughStore[]>([])
  const [storeId, setStoreId] = useState('')
  const [visitDate, setVisitDate] = useState(() => todayInLosAngeles())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listWalkthroughStores(access.organization.organization_id)
      .then((result) => {
        if (!active) return
        const writable = result.filter((item) => item.can_edit)
        setStores(writable)
        setStoreId(writable[0]?.store_id || '')
      })
      .catch((cause: unknown) => { if (active) setError(walkthroughMessage(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [access.organization.organization_id])

  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stores.some((item) => item.store_id === storeId) || !validVisitDate(visitDate)) {
      setError('Choose a store and a valid visit date.')
      return
    }
    window.location.hash = `#/walkthroughs/${encodeURIComponent(storeId)}/${visitDate}`
  }

  return <div className="vy-walkthroughs">
    <a className="vy-walk-back" href="#/walkthroughs"><ArrowLeft size={16} /> Store walk-throughs</a>
    <header className="vy-walk-head"><div><h1>Start a walk-through</h1><p>Choose the store and date of the visit.</p></div></header>
    {error && <p className="vy-walk-error" role="alert">{error}</p>}
    {loading ? <p className="vy-walk-message" role="status">Loading stores...</p> : !stores.length ? <p className="vy-walk-message">No active stores are available for editing.</p> : <form className="vy-walk-start" onSubmit={open}>
      <label>Store<SelectField value={storeId} onChange={setStoreId} options={stores.map((store) => ({ value: store.store_id, label: store.name }))} /></label>
      <label>Visit date<DateField value={visitDate} onChange={setVisitDate} required /></label>
      <button type="submit" className="vy-button vy-button-dark">Open walk-through</button>
    </form>}
  </div>
}
