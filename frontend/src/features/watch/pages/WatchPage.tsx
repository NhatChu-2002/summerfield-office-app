import { useState, type KeyboardEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { WatchDialog } from '../components/WatchDialog'
import { safeWatchUrl, visibleWatchItems, type WatchAlert, type WatchBriefing, type WatchDraft, type WatchItem } from '../model'
import { previewAlerts } from '../preview-data'
import './watch.css'

type WatchTab = 'brief' | 'inbox' | 'saved' | 'learn'
const tabs: WatchTab[] = ['brief', 'inbox', 'saved', 'learn']
const kindLabel = { alert: 'Alert', review: 'Review', note: 'Spotted' }

export default function WatchPage({ departments, preview, items = [], briefings = [], onItemsChange }: {
  departments: ReferenceDepartment[]
  preview: boolean
  items?: WatchItem[]
  briefings?: WatchBriefing[]
  onItemsChange?: (items: WatchItem[]) => void
}) {
  const [tab, setTab] = useState<WatchTab>('brief')
  const [inboxFilter, setInboxFilter] = useState('all')
  const [department, setDepartment] = useState('')
  const [editor, setEditor] = useState<{ initial: Partial<WatchDraft>; id?: string } | null>(null)
  const canEdit = preview && !!onItemsChange
  const availableDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const filterDepartments = [{ value: '', label: 'Everyone' }, ...availableDepartments.map((item) => ({ value: item.code, label: item.name }))]
  const departmentByCode = (code: string) => availableDepartments.find((item) => item.code === code) || companyDepartment
  const savedSourceIds = new Set(items.map((item) => item.sourceId).filter(Boolean))
  const alerts = preview ? previewAlerts.filter((alert) => !savedSourceIds.has(alert.id) && (inboxFilter === 'all' || alert.kind === inboxFilter)) : []
  const saved = visibleWatchItems(items, department)

  function openAlert(alert: WatchAlert) {
    setEditor({ initial: {
      title: alert.subject, kind: alert.kind, date: alert.date, department: 'company',
      source: alert.sender, summary: alert.snippet, sourceId: alert.id,
    } })
  }

  function saveItem(draft: WatchDraft) {
    if (!onItemsChange) return
    onItemsChange(editor?.id
      ? items.map((item) => item.id === editor.id ? { ...item, ...draft } : item)
      : [...items, { ...draft, id: crypto.randomUUID() }])
    setEditor(null)
    setTab('saved')
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.indexOf(tab)
    const next = event.key === 'ArrowRight' ? (current + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    setTab(tabs[next])
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return <>
    <header className="vy-hero vy-watch-hero">
      <div><h1>Market watch</h1><p>What is happening around us: the industry, our area, our competitors, and what people are saying about our stores. Read it, then take one thing from it.</p></div>
      <div className="vy-hero-actions">
        <button type="button" className="vy-button" disabled title="Email alerts are not connected yet">Check my email for alerts</button>
        <button type="button" className="vy-button vy-button-dark" onClick={() => setEditor({ initial: {} })}>Add something</button>
      </div>
    </header>
    {!preview && <p className="vy-watch-status">Market watch is being rebuilt. Shared briefings, saved items, email alerts, and analysis are not connected yet.</p>}
    <div className="vy-watch-tabs" role="tablist" aria-label="Market watch views" onKeyDown={onTabKeyDown}>
      {tabs.map((key) => <button key={key} type="button" role="tab" id={`vy-watch-tab-${key}`} aria-controls="vy-watch-panel" aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}>{key === 'brief' ? `Briefings ${briefings.length}` : key === 'inbox' ? 'Alert inbox' : key === 'saved' ? `What we saved ${items.length}` : 'What we can learn'}</button>)}
    </div>
    <div id="vy-watch-panel" role="tabpanel" aria-labelledby={`vy-watch-tab-${tab}`} className="vy-watch-panel" tabIndex={0}>
      {tab === 'brief' && <>
        {briefings.length ? [...briefings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map((briefing) => <article className="vy-watch-brief" key={briefing.id}><h2>{briefing.title || 'Briefing'}</h2><p className="vy-watch-meta">{displayDate(briefing.date, true)}{briefing.source && ` | ${briefing.source}`}</p><p className="vy-watch-brief-body">{briefing.body}</p></article>) : <div className="vy-watch-empty">No briefings yet. Shared market briefings will appear here when the feed is connected.</div>}
        <section className="vy-watch-setup" aria-labelledby="vy-watch-setup-title"><h2 id="vy-watch-setup-title">Make the feed fill itself</h2><ol>
          <li>Set up Google Alerts for <code>boba Orange County</code>, <code>bubble tea California</code>, nearby openings, competitor names, and <code>Summerfield Tea Bar</code>.</li>
          <li>Choose daily delivery to the account your team will use for alerts.</li>
          <li>Turn on Yelp and Google Business review notifications for that inbox.</li>
          <li>When the email connection is ready, use Alert inbox to review and save what matters.</li>
        </ol></section>
      </>}
      {tab === 'inbox' && <>
        <div className="vy-watch-toolbar"><label className="vy-watch-select-label">What to look for<SelectField size="compact" value={inboxFilter} onChange={setInboxFilter} options={[{ value: 'all', label: 'Everything (alerts and reviews)' }, { value: 'alert', label: 'Google Alerts only' }, { value: 'review', label: 'Reviews only' }]} /></label><button type="button" className="vy-button vy-button-dark vy-button-small" disabled title="Email alerts are not connected yet">Check my email</button><span>{preview ? 'Sample messages only. No inbox is read.' : 'Email alerts are not connected yet.'}</span></div>
        {alerts.length ? <ul className="vy-watch-list">{alerts.map((alert) => <li className={`vy-watch-item vy-watch-item-${alert.kind}`} key={alert.id}><h2>{alert.subject}</h2><div className="vy-watch-meta"><span className={`vy-watch-kind vy-watch-kind-${alert.kind}`}>{kindLabel[alert.kind]}</span><span>{alert.sender}</span><span>{displayDate(alert.date, true)}</span></div><p>{alert.snippet}</p>{canEdit && <button type="button" className="vy-button vy-button-small" onClick={() => openAlert(alert)}>Save this</button>}</li>)}</ul> : <div className="vy-watch-empty">{preview ? 'No sample messages match this filter.' : 'Alerts and review notifications will appear here when email is connected.'}</div>}
      </>}
      {tab === 'saved' && <>
        <div className="vy-watch-toolbar"><label className="vy-watch-select-label">Department<SelectField size="compact" value={department} onChange={setDepartment} options={filterDepartments} /></label><button type="button" className="vy-button vy-button-small" onClick={() => setEditor({ initial: {} })}>Add something</button></div>
        {saved.length ? <ul className="vy-watch-list">{saved.map((item) => {
          const href = safeWatchUrl(item.url)
          const itemDepartment = departmentByCode(item.department)
          return <li className="vy-watch-item" style={departmentStyle(itemDepartment.color)} key={item.id}>
            <h2>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{item.title} <ArrowUpRight size={14} aria-label="Opens in a new tab" /></a> : item.title}</h2>
            <div className="vy-watch-meta"><span className={`vy-watch-kind vy-watch-kind-${item.kind}`}>{kindLabel[item.kind]}</span><span className="vy-watch-department" style={departmentStyle(itemDepartment.color)}>{itemDepartment.name}</span><span>{displayDate(item.date, true)}</span>{item.source && <span>{item.source}</span>}</div>
            {item.summary && <p>{item.summary}</p>}{item.lesson && <p className="vy-watch-lesson"><strong>What we take from it:</strong> {item.lesson}</p>}
            {canEdit && <div className="vy-watch-item-actions"><button type="button" className="vy-button vy-button-small vy-button-ghost" onClick={() => setEditor({ initial: item, id: item.id })}>Edit</button><button type="button" className="vy-button vy-button-small vy-button-ghost" onClick={() => onItemsChange(items.filter((savedItem) => savedItem.id !== item.id))}>Remove</button><button type="button" className="vy-button vy-button-small vy-button-ghost" disabled title="Task conversion is not connected yet">Turn into a task</button></div>}
          </li>
        })}</ul> : <div className="vy-watch-empty">{department ? 'Nothing saved for this department yet.' : preview ? 'Nothing saved yet. Save a sample alert from the inbox, or add something you spotted.' : 'Shared saved items will appear here when Market watch is connected.'}</div>}
      </>}
      {tab === 'learn' && <>
        <section className="vy-watch-learn" aria-labelledby="vy-watch-learn-title"><h2 id="vy-watch-learn-title">What we can learn</h2><p>Patterns, risks, and ideas from the items the team saves will appear here when analysis is connected.</p><div className="vy-watch-toolbar"><button type="button" className="vy-button vy-button-dark vy-button-small" disabled title="Market analysis is not connected yet">Read the last 90 days</button><label className="vy-watch-select-label">Department<SelectField size="compact" value={department} onChange={setDepartment} options={filterDepartments} /></label></div></section>
        <section className="vy-watch-discussion" aria-labelledby="vy-watch-discussion-title"><h2 id="vy-watch-discussion-title">Team discussion starters</h2><p>Use one at the weekly meeting.</p><ul><li>What did a competitor do this month that our customers would notice?</li><li>What is the last review that stung, and what did we change because of it?</li><li>What are we doing only because we have always done it?</li><li>If a new boba shop opened across the street tomorrow, what would we fix first?</li></ul></section>
      </>}
    </div>
    {editor && <WatchDialog key={editor.id || editor.initial.sourceId || 'new'} departments={availableDepartments} initial={editor.initial} editing={!!editor.id} canSave={canEdit} onSave={saveItem} onClose={() => setEditor(null)} />}
  </>
}
