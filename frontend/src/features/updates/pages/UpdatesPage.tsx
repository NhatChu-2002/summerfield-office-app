import type { HqUpdate } from '../api'
import { UpdateList } from '../components/UpdateList'

export function UpdatesPage({ updates }: { updates: HqUpdate[] }) {
  return <><div className="page-heading"><div><p className="eyebrow">From the team</p><h1>Updates</h1><p>Progress and decisions from the departments you can access.</p></div></div><section className="section list-page"><UpdateList updates={updates} empty="No updates have been posted yet." /></section></>
}
