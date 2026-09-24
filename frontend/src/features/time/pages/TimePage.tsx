import { useEffect, useState, type KeyboardEvent } from 'react'
import { Clock3, Download, PencilLine } from 'lucide-react'
import { SelectField } from '@/shared/ui/SelectField'
import { displayDate } from '@/shared/lib/format'
import { CorrectionDialog } from '../components/CorrectionDialog'
import { localDateKey, periodsBack, punchShift, workedMinutes, type PunchAction, type TimeCorrection, type TimeEntry } from '../model'
import './time.css'

const names: Record<string, string> = { 'preview-me': 'You (sample)', 'preview-teammate': 'Sample teammate' }
const shortTime = (value?: string) => value ? new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`

function TimeRows({ entries, now, preview, showPerson, onFix }: {
  entries: TimeEntry[]
  now: string
  preview: boolean
  showPerson?: boolean
  onFix: (date: string) => void
}) {
  if (!entries.length) return <p className="vy-time-empty">Nothing recorded for this period.</p>
  return <div className="vy-time-table-wrap"><table className="vy-time-table"><thead><tr>
    {showPerson && <th>Who</th>}<th>Day</th><th>In</th><th>Out</th><th>Meal</th><th>Worked</th><th>Status</th><th aria-label="Actions" />
  </tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}>
    {showPerson && <td>{names[entry.personId] || 'Preview person'}</td>}
    <td>{displayDate(entry.date)}</td><td>{shortTime(entry.inAt)}</td><td>{shortTime(entry.outAt)}</td>
    <td>{entry.meals.length ? entry.meals.map((meal, index) => <span key={index} className="vy-time-meal">{shortTime(meal.startAt)}–{meal.endAt ? shortTime(meal.endAt) : 'in progress'}</span>) : '—'}</td>
    <td className="vy-time-number">{duration(workedMinutes(entry, now))}</td><td>{entry.outAt ? 'Complete' : entry.meals.some((meal) => !meal.endAt) ? 'Meal' : 'Open'}</td>
    <td>{preview && entry.personId === 'preview-me' && <button type="button" className="vy-time-row-action" title="Ask to correct this day" aria-label={`Ask to correct ${displayDate(entry.date)}`} onClick={() => onFix(entry.date)}><PencilLine size={15} /></button>}</td>
  </tr>)}</tbody></table></div>
}

export default function TimePage({ entries, corrections, preview, canReview, onEntriesChange, onCorrectionsChange }: {
  entries: TimeEntry[]
  corrections: TimeCorrection[]
  preview: boolean
  canReview: boolean
  onEntriesChange?: (entries: TimeEntry[]) => void
  onCorrectionsChange?: (requests: TimeCorrection[]) => void
}) {
  const [now, setNow] = useState(() => new Date().toISOString())
  const [periodStart, setPeriodStart] = useState(() => periodsBack(new Date())[0].start)
  const [tab, setTab] = useState<'me' | 'team' | 'requests'>('me')
  const [fixDate, setFixDate] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date().toISOString()), 30_000); return () => window.clearInterval(timer) }, [])
  const periods = periodsBack(new Date(now))
  const period = periods.find((item) => item.start === periodStart) || periods[0]
  const inPeriod = entries.filter((entry) => entry.date >= period.start && entry.date <= period.end)
    .sort((a, b) => b.date.localeCompare(a.date) || a.personId.localeCompare(b.personId))
  const own = inPeriod.filter((entry) => entry.personId === 'preview-me')
  const today = localDateKey(new Date(now))
  const current = entries.find((entry) => entry.personId === 'preview-me' && entry.date === today)
  const openMeal = current?.meals.some((meal) => !meal.endAt) || false
  const pending = corrections.filter((request) => request.status === 'pending').length
  const active = Boolean(current && !current.outAt)

  function punch(action: PunchAction) {
    if (!preview) return
    try {
      const instant = new Date().toISOString()
      const next = punchShift(current, action, instant, 'preview-me')
      onEntriesChange?.([...entries.filter((entry) => entry.id !== next.id), next])
      setNow(instant)
      setError('')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'This punch could not be recorded.') }
  }

  function review(id: string, status: 'reviewed' | 'declined') {
    onCorrectionsChange?.(corrections.map((request) => request.id === id ? { ...request, status } : request))
  }

  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const order = ['me', 'team', 'requests'] as const
    const index = order.indexOf(tab)
    const next = event.key === 'ArrowRight' ? order[(index + 1) % order.length]
      : event.key === 'ArrowLeft' ? order[(index + order.length - 1) % order.length]
        : event.key === 'Home' ? order[0] : event.key === 'End' ? order[order.length - 1] : null
    if (!next) return
    event.preventDefault()
    setTab(next)
    window.requestAnimationFrame(() => document.getElementById(`vy-time-tab-${next}`)?.focus())
  }

  return <>
    <header className="vy-hero vy-time-hero"><div><h1>Time clock</h1><p>See shifts, breaks, and requests in one place.</p></div><div className="vy-hero-actions">
      <SelectField ariaLabel="Pay period" value={period.start} onChange={setPeriodStart} options={periods.map((item) => ({ value: item.start, label: item.label }))} size="compact" />
      {canReview && <button type="button" className="vy-button" disabled title="Payroll export is not connected"><Download size={15} /> Export payroll</button>}
    </div></header>
    <p className="vy-time-status">{preview ? 'Design preview only. Punches and requests stay here until you reload; nothing reaches HR or payroll.' : 'HQ time records, HR requests, and payroll export are not connected yet. Use your approved timekeeping system.'}</p>
    {canReview && <div className="vy-time-tabs" role="tablist" aria-label="Time views" onKeyDown={moveTab}>
      <button id="vy-time-tab-me" type="button" role="tab" aria-selected={tab === 'me'} tabIndex={tab === 'me' ? 0 : -1} onClick={() => setTab('me')}>My time</button>
      <button id="vy-time-tab-team" type="button" role="tab" aria-selected={tab === 'team'} tabIndex={tab === 'team' ? 0 : -1} onClick={() => setTab('team')}>Everyone</button>
      <button id="vy-time-tab-requests" type="button" role="tab" aria-selected={tab === 'requests'} tabIndex={tab === 'requests' ? 0 : -1} onClick={() => setTab('requests')}>Requests{pending ? ` (${pending})` : ''}</button>
    </div>}
    {tab === 'me' && <div className="vy-time-layout">
      <section className="vy-time-sheet" aria-labelledby="vy-time-sheet-title"><div className="vy-time-section-head"><h2 id="vy-time-sheet-title">{period.label}</h2><span>{preview ? `${duration(own.reduce((sum, entry) => sum + workedMinutes(entry, now), 0))} recorded` : 'No connected records'}</span></div>
        <TimeRows entries={own} now={now} preview={preview} onFix={setFixDate} /></section>
      <section className="vy-time-clock" aria-label="Today's time clock"><Clock3 size={19} aria-hidden="true" /><div className="vy-time-now">{new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        <p className="vy-time-state">{!current ? 'Not clocked in' : current.outAt ? 'Clocked out for today' : openMeal ? 'On a meal break' : 'On the clock'}</p>
        <strong className="vy-time-elapsed">{current ? duration(workedMinutes(current, now)) : '0h 00m'}</strong><span className="vy-time-worked-label">recorded work today</span>
        <div className="vy-time-actions">{!current ? <button type="button" className="vy-button vy-button-dark" disabled={!preview} onClick={() => punch('in')}>Clock in</button> : active && openMeal ? <button type="button" className="vy-button vy-button-dark" onClick={() => punch('mealEnd')}>End meal</button> : active ? <><button type="button" className="vy-button" onClick={() => punch('mealStart')}>Start meal</button><button type="button" className="vy-button" onClick={() => punch('rest')}>Log rest</button><button type="button" className="vy-button vy-button-dark" onClick={() => punch('out')}>Clock out</button></> : null}</div>
        {current && <div className="vy-time-timeline"><span>In {shortTime(current.inAt)}</span>{current.meals.map((meal, index) => <span key={`meal-${index}`}>Meal {shortTime(meal.startAt)}–{meal.endAt ? shortTime(meal.endAt) : 'in progress'}</span>)}{current.rests.map((rest, index) => <span key={`rest-${index}`}>Rest {shortTime(rest)}</span>)}{current.outAt && <span>Out {shortTime(current.outAt)}</span>}</div>}
        {error && <p role="alert" className="vy-time-error">{error}</p>}
        <button type="button" className="vy-time-correct" disabled={!preview} onClick={() => setFixDate(today)}>Something wrong? Ask HR</button>
      </section>
    </div>}
    {tab === 'team' && canReview && <section className="vy-time-sheet" aria-labelledby="vy-time-team-title"><div className="vy-time-section-head"><h2 id="vy-time-team-title">Everyone · {period.label}</h2><span>{preview ? `${new Set(inPeriod.map((entry) => entry.personId)).size} people in this sample` : 'No connected records'}</span></div><TimeRows entries={inPeriod} now={now} preview={false} showPerson onFix={setFixDate} /></section>}
    {tab === 'requests' && canReview && <section className="vy-time-requests" aria-labelledby="vy-time-requests-title"><h2 id="vy-time-requests-title">Correction requests</h2>
      {corrections.length ? corrections.map((request) => <article key={request.id} className="vy-time-request"><div><h3>{names[request.personId] || 'Preview person'} · {displayDate(request.date)}</h3><span className={`vy-time-request-status is-${request.status}`}>{request.status}</span></div>
        <p>Requested: {request.desiredIn || '—'} to {request.desiredOut || '—'}</p><p>{request.reason}</p>
        {request.status === 'pending' && preview && <div className="vy-time-request-actions"><button type="button" className="vy-button vy-button-dark" onClick={() => review(request.id, 'reviewed')}>Mark reviewed</button><button type="button" className="vy-button" onClick={() => review(request.id, 'declined')}>Decline preview request</button></div>}</article>) : <p className="vy-time-empty">No correction requests.</p>}
    </section>}
    <p className="vy-time-disclaimer">This screen is not a payroll calculation or compliance determination. Confirm official records and policies with HR.</p>
    {fixDate !== null && preview && <CorrectionDialog key={fixDate} date={fixDate} onSave={(request) => { onCorrectionsChange?.([...corrections, request]); setFixDate(null) }} onClose={() => setFixDate(null)} />}
  </>
}
