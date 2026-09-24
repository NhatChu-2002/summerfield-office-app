import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMyDepartment } from '@/shared/lib/my-department'
import { referenceHref } from '@/shared/config/reference-departments'
import './help.css'

type Guide = { title: string; outcome: string; steps: string[]; href: string; link: string }

const guides: Guide[] = [
  {
    title: 'Find your team', outcome: 'Your department work and updates stay together.',
    steps: ['Choose My department in the navigation.', 'Open its dashboard to see the current tasks and updates.', 'Use Department folders to see the folder map; shared Drive links are still being connected.'],
    href: '#/folders', link: 'Department folders',
  },
  {
    title: 'Keep up with your tasks', outcome: 'See what needs your attention first.',
    steps: ['Open My tasks to see overdue, today, this week and later.', 'Open a task for its details and owner.', 'Mark it done when the work is finished.'],
    href: '#/tasks', link: 'My tasks',
  },
  {
    title: 'Share a team update', outcome: 'Keep the people in your department informed.',
    steps: ['Open your department dashboard.', 'If you have write access, post an update in Team updates.', 'Read recent updates on the dashboard or the Updates page.'],
    href: '#/updates', link: 'All updates',
  },
  {
    title: 'Check the team calendar', outcome: 'See the calendar layout and choose which teams to show.',
    steps: ['Open Team calendar and turn department calendars on or off.', 'Switch between month and list views.', 'Shared events are not connected yet; events made in Design preview are temporary.'],
    href: '#/calendar', link: 'Team calendar',
  },
  {
    title: 'Make the dashboard yours', outcome: 'Put the departments you use most in view.',
    steps: ['Open the dashboard and choose Edit layout.', 'Show or hide department cards.', 'Choose My department in the navigation for a quick route back to your team.'],
    href: '#/', link: 'Dashboard',
  },
]

const tourSteps = [
  { title: 'Welcome to HQ', body: 'The dashboard brings your departments, tasks and recent updates into one place.', href: '#/', link: 'Open dashboard' },
  { title: 'Your department', body: 'Choose My department in the navigation, then open its dashboard for team tasks and updates.', href: '#/', link: 'Open dashboard' },
  { title: 'My tasks', body: 'Assignments are grouped by when they need attention. Open a task for details or mark it done.', href: '#/tasks', link: 'Open My tasks' },
  { title: 'Team calendar', body: 'Browse by month or list and choose the teams you see. Shared events will come with the calendar connection.', href: '#/calendar', link: 'Open calendar' },
  { title: 'Department folders', body: 'Find each team’s folder map here. Direct Drive links and shared-file actions are still being connected.', href: '#/folders', link: 'Open folders' },
]

function TourDialog({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState(0)
  const current = tourSteps[step]

  useEffect(() => {
    const node = dialog.current
    if (node && !node.open) node.showModal()
  }, [])

  return <dialog ref={dialog} className="vy-help-tour" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) onClose() }} aria-labelledby="vy-help-tour-title">
    <div className="vy-help-tour-head"><span>Step {step + 1} of {tourSteps.length}</span><button type="button" aria-label="Close tour" onClick={onClose}><X size={18} /></button></div>
    <img src="/sunny-base.webp" alt="" className="vy-help-tour-sunny" />
    <h2 id="vy-help-tour-title">{current.title}</h2>
    <p>{current.body}</p>
    <a href={current.href} onClick={onClose} className="vy-help-tour-link">{current.link} <ArrowRight size={15} /></a>
    <div className="vy-help-tour-footer"><div className="vy-help-tour-dots" aria-label={`Step ${step + 1} of ${tourSteps.length}`}>{tourSteps.map((item, index) => <span key={item.title} className={index === step ? 'is-current' : ''} />)}</div><div className="vy-help-tour-actions"><button type="button" className="vy-button vy-button-small" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft size={15} /> Back</button><button type="button" className="vy-button vy-button-dark vy-button-small" onClick={() => step === tourSteps.length - 1 ? onComplete() : setStep(step + 1)}>{step === tourSteps.length - 1 ? 'Done' : 'Next'} {step === tourSteps.length - 1 ? <Check size={15} /> : <ChevronRight size={15} />}</button></div></div>
  </dialog>
}

export default function HelpPage({ departments }: { departments: { code: string; name: string }[] }) {
  const [myDepartment] = useMyDepartment()
  const [tourOpen, setTourOpen] = useState(() => window.location.hash === '#/help/tour')
  const [tourDone, setTourDone] = useState(() => { try { return localStorage.getItem('sfhq_tour_done') === '1' } catch { return false } })
  const department = departments.find((item) => item.code === myDepartment)
  const closeTour = () => { setTourOpen(false); if (window.location.hash === '#/help/tour') window.location.hash = '#/help' }
  const completeTour = () => { try { localStorage.setItem('sfhq_tour_done', '1'); localStorage.setItem('sfhq_tour_dismissed', '1') } catch { /* A private browser can still complete the tour. */ } setTourDone(true); closeTour() }

  return <>
    <header className="vy-hero vy-help-hero"><div><h1>How HQ works</h1><p>Short guides for the things you do most. Take the two-minute tour, or jump to the one you need.</p></div><div className="vy-hero-actions"><button className="vy-button vy-button-dark" type="button" onClick={() => setTourOpen(true)}>Show me around <ArrowRight size={16} /></button></div></header>
    <div className="vy-help-layout">
      <section className="vy-help-common" aria-labelledby="vy-help-common-title"><h2 id="vy-help-common-title">Common jobs</h2><div className="vy-help-grid">{guides.map((guide) => <article className="vy-help-card" key={guide.title}><h3>{guide.title}</h3><p>{guide.outcome}</p><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol><a href={guide.href}>{guide.link} <ArrowRight size={14} /></a></article>)}</div></section>
      <div className="vy-help-side">
        <section className="vy-panel" aria-labelledby="vy-help-start-title"><h2 id="vy-help-start-title">Start here</h2><p className="vy-help-muted">A few good first stops in HQ.</p><ul className="vy-help-start"><li><span className={department ? 'is-done' : ''}>{department ? <Check size={14} /> : '1'}</span><div><strong>Choose your department</strong>{department && <small>{department.name} selected</small>}</div><a href={department ? referenceHref(department.code) : '#/'}>{department ? 'Open' : 'Dashboard'}</a></li><li><span className={tourDone ? 'is-done' : ''}>{tourDone ? <Check size={14} /> : '2'}</span><div><strong>Take the tour</strong></div><button type="button" onClick={() => setTourOpen(true)}>{tourDone ? 'Again' : 'Start'}</button></li><li><span>3</span><div><strong>Look at your tasks</strong></div><a href="#/tasks">Open</a></li><li><span>4</span><div><strong>Pick your calendars</strong></div><a href="#/calendar">Open</a></li></ul></section>
        <section className="vy-panel" aria-labelledby="vy-help-phone-title"><h2 id="vy-help-phone-title">HQ on your phone</h2><p>Open the HQ link in your phone’s browser and sign in with your account. You can bookmark it for quick access.</p><p className="vy-help-muted">Shared events and Drive files will appear here when those connections are ready.</p></section>
        <section className="vy-panel" aria-labelledby="vy-help-stuck-title"><h2 id="vy-help-stuck-title">Still stuck?</h2><p>Check recent team updates or open your department to ask the people you work with.</p><div className="vy-help-side-actions"><a className="vy-button vy-button-small" href="#/updates">Team updates <ArrowRight size={14} /></a><a className="vy-button vy-button-small" href="#/">Dashboard <ArrowRight size={14} /></a></div></section>
      </div>
    </div>
    {tourOpen && <TourDialog onClose={closeTour} onComplete={completeTour} />}
  </>
}
