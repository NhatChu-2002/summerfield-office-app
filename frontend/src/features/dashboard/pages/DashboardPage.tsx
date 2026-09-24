import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { referenceDepartments, referenceForDepartment, sortLikeReference } from '@/shared/config/reference-departments'
import { useMyDepartment } from '@/shared/lib/my-department'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import { Panel } from '@/shared/ui/Panel'
import type { Access } from '@/features/auth'
import type { HqTask } from '@/features/tasks'
import type { HqUpdate } from '@/features/updates'
import { DepartmentCard } from '../components/DepartmentCard'

const greeting = () => `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}`
const readHiddenCards = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('sfhq_hidden_department_cards') || '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch { return [] }
}

export function DashboardPage({ access, tasks, updates, preview, dataReady, taskContent, updateContent }: {
  access: Access; tasks: HqTask[]; updates: HqUpdate[]; preview: boolean; dataReady: boolean;
  taskContent: ReactNode; updateContent: ReactNode
}) {
  const [tour, setTour] = useState(() => localStorage.getItem('sfhq_tour_dismissed') !== '1')
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState<string[]>(readHiddenCards)
  useEffect(() => localStorage.setItem('sfhq_hidden_department_cards', JSON.stringify(hidden)), [hidden])
  const [myDepartment] = useMyDepartment()
  const departments = preview ? referenceDepartments : sortLikeReference(access.departments.map(referenceForDepartment))
  const visible = departments.filter((item) => !hidden.includes(item.code))
  const openTasks = tasks.filter((item) => item.status === 'open' && item.assigned_to === access.userId)
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return <>
    <div className="vy-preview-note">{preview ? <><b>Design preview.</b> Explore the new HQ interface. Company data is not connected and changes are not saved.</> : !dataReady ? <><b>Data unavailable.</b> Task and update totals are hidden until HQ data loads.</> : <><b>HQ workspace.</b> Tasks and team updates are connected; other sections are being rebuilt.</>}</div>
    <header className="vy-hero vy-home-hero"><div><h1>{greeting()}</h1><p>{date}. Every department’s tools, folders and dates in one place.</p></div><div className="vy-hero-actions"><a className="vy-button" href="#/projects">Projects</a><button className="vy-button" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit layout'}</button><ComingSoonButton><Plus size={15} /> New event</ComingSoonButton></div></header>
    {tour && <div className="vy-tour-banner"><b>New here?</b> Take the two-minute tour and you’ll know where everything lives.<div className="vy-tour-actions"><a className="vy-button vy-button-dark vy-button-small" href="#/help/tour">Show me around</a><a className="vy-button vy-button-small" href="#/help">All the guides</a><button className="vy-button vy-button-ghost vy-button-small" type="button" onClick={() => { setTour(false); localStorage.setItem('sfhq_tour_dismissed', '1') }}>No thanks</button></div></div>}
    {editing && <div className="vy-layout-editor"><strong>Department cards</strong><span>Choose what appears on this dashboard.</span><div>{departments.map((item) => <label key={item.code}><input type="checkbox" checked={!hidden.includes(item.code)} onChange={(event) => setHidden((list) => event.target.checked ? list.filter((code) => code !== item.code) : [...list, item.code])} /> {item.name}</label>)}</div></div>}
    <div className="vy-dashboard-grid">{visible.map((item) => <DepartmentCard key={item.code} department={item} myDepartment={myDepartment} />)}</div>
    <div className="vy-dashboard-lower"><Panel title="My tasks" action={<a className="vy-panel-link" href="#/tasks">All my tasks <ArrowRight size={15} /></a>}>{dataReady ? taskContent : <p className="vy-empty">{preview ? 'Task data is not connected in this preview.' : 'Task data is temporarily unavailable.'}</p>}</Panel><Panel title="Next two weeks" action={<a className="vy-panel-link" href="#/calendar">Open calendar <ArrowRight size={15} /></a>}><p className="vy-empty">Calendar data will appear here after migration.</p></Panel><Panel title="Team notes" action={<a className="vy-panel-link" href="#/updates">All updates <ArrowRight size={15} /></a>}>{dataReady ? updateContent : <p className="vy-empty">{preview ? 'Team notes are not connected in this preview.' : 'Team notes are temporarily unavailable.'}</p>}</Panel><Panel title="Running projects" action={<a className="vy-panel-link" href="#/projects">All projects <ArrowRight size={15} /></a>}><p className="vy-empty">Project records will appear here after migration.</p></Panel><Panel title="Who to ask" action={<a className="vy-panel-link" href="#/ask">Open the list <ArrowRight size={15} /></a>}><label className="vy-mini-search">What do you need?<input disabled placeholder="Search team owners" /></label></Panel><Panel title="Decision chart" action={<a className="vy-panel-link" href="#/decisions">Open the chart <ArrowRight size={15} /></a>}><p className="vy-empty">Decision owners are not connected yet.</p></Panel><Panel title="Files & links" action={<ComingSoonButton><Plus size={14} /> Add a link</ComingSoonButton>}><p className="vy-empty">Shared files will appear here after migration.</p></Panel></div>
    {dataReady && <span className="sr-only">{openTasks.length} open tasks assigned to you. {updates.length} team updates.</span>}
  </>
}
