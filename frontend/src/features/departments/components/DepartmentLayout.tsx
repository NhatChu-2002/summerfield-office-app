import type { ReactNode } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { useMyDepartment } from '@/shared/lib/my-department'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import { DepartmentIcon } from '@/shared/ui/icons'
import { Panel } from '@/shared/ui/Panel'
import { DepartmentFolderCard } from '@/features/folders'

// Vy's department screen. The signed-in page and design preview both fill it in.
export function DepartmentLayout({ department, role, taskContent, updateContent, onNewTask, writable, dataReady }: {
  department: ReferenceDepartment; role: string;
  taskContent: ReactNode; updateContent: ReactNode; onNewTask: () => void; writable: boolean; dataReady: boolean
}) {
  const [myDepartment, chooseMine] = useMyDepartment()
  const isMine = myDepartment === department.code
  const preview = role === 'Preview'
  return <>
    <header className="vy-hero vy-department-hero" style={departmentStyle(department.color)}><div><h1><DepartmentIcon code={department.code} size={34} /> {department.name} dashboard</h1><p>{department.full}</p>{!preview && <span className="vy-department-access">{role} access</span>}</div><div className="vy-hero-actions">{department.tool && <ComingSoonButton>Open {department.tool}</ComingSoonButton>}<ComingSoonButton><Plus size={15} /> New {department.name} event</ComingSoonButton><ComingSoonButton>Email this team</ComingSoonButton>{!isMine && <button className="vy-button" type="button" onClick={() => chooseMine(department.code)}>Make this my department</button>}</div></header>
    {!dataReady && <div className="vy-preview-note">{preview ? 'Design preview: department records are not connected, and changes are not saved.' : 'Task and update data is temporarily unavailable. Actions that save records are paused.'}</div>}
    <div className="vy-department-columns"><div className="vy-stack"><Panel title="Coming up" action={<label className="vy-checkbox" title="Calendar visibility is available after the calendar migration"><input type="checkbox" checked disabled /> Show on my calendar</label>}><p className="vy-empty">Nothing on the {department.name} calendar in the next 90 days.</p></Panel>
      <Panel title="Projects & tasks" action={<a className="vy-panel-link" href="#/projects">All projects <ArrowRight size={15} /></a>}>{dataReady ? taskContent : <p className="vy-empty">{preview ? 'Task data is not connected in this preview.' : 'Task data is temporarily unavailable.'}</p>}{writable && <button className="vy-button vy-button-small vy-panel-bottom" type="button" onClick={onNewTask}><Plus size={14} /> Add a task</button>}</Panel>
      <Panel title="Locations we look after"><p className="vy-empty">Location records will be connected in a later migration phase.</p></Panel>
      <Panel title="Files & links" action={<ComingSoonButton><Plus size={14} /> Add a link</ComingSoonButton>}><p className="vy-empty">No links pinned for this department yet.</p></Panel>
      <Panel title="Team notes">{dataReady ? updateContent : <p className="vy-empty">{preview ? 'Team notes are not connected in this preview.' : 'Team notes are temporarily unavailable.'}</p>}</Panel>
    </div><div className="vy-stack"><DepartmentFolderCard department={department} showSharedEmpty />
      <Panel title="Shared records"><p className="vy-empty">Build-Out and I&M records will be available after migration.</p></Panel>
      <Panel title="Decisions this team makes" action={<a className="vy-panel-link" href="#/decisions">Full chart <ArrowRight size={15} /></a>}><p className="vy-empty">No decisions written down for this team yet.</p></Panel>
      <Panel title="What this team owns" action={<a className="vy-panel-link" href="#/ask">Who to ask <ArrowRight size={15} /></a>}><p className="vy-empty">Team ownership records will be added later.</p></Panel>
      <div className="vy-access-note">{role} access · {department.name}</div>
    </div></div>
  </>
}
