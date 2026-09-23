import { useMemo } from 'react'
import { todayLocal } from '@/shared/lib/format'
import { ComingSoonButton } from '@/shared/ui/ComingSoonButton'
import type { Access } from '@/features/auth'
import type { HqTask } from '../api'
import { TaskList, type PeopleNames } from '../components/TaskList'
import { bucketMyTasks, delegatedTasks } from '../model'

// Vy's "My tasks": everything assigned to you, grouped by when it's due, plus what you've asked others to do.
export function MyTasksPage({ access, tasks, dataReady, preview = false, names, busyId, canCreate, onNewTask, onToggle, onOpen }: {
  access: Access; tasks: HqTask[]; dataReady: boolean; preview?: boolean; names: PeopleNames; busyId: string | null
  canCreate: boolean; onNewTask: () => void; onToggle: (task: HqTask) => void; onOpen: (task: HqTask) => void
}) {
  const today = todayLocal()
  const buckets = useMemo(() => bucketMyTasks(tasks, access.userId, today), [tasks, access.userId, today])
  const delegated = useMemo(() => delegatedTasks(tasks, access.userId), [tasks, access.userId])
  const list = (items: HqTask[]) => <TaskList tasks={items} access={access} onToggle={onToggle} busyId={busyId} empty="Nothing here." onOpen={onOpen} names={names} />

  return <>
    {preview && <div className="vy-preview-note"><b>Design preview.</b> These are sample tasks. Changes stay on this screen and are not saved.</div>}
    <header className="vy-hero vy-tasks-hero">
      <div><h1>My tasks</h1><p>Everything assigned to you across every project and department.</p></div>
      <div className="vy-hero-actions">
        {canCreate && <button className="vy-button vy-button-dark" type="button" onClick={onNewTask}>New task</button>}
        <ComingSoonButton small={false}>Email me my week</ComingSoonButton>
        {access.organization.role === 'admin' && <ComingSoonButton small={false}>Draft everyone's week</ComingSoonButton>}
        <a className="vy-button" href="#/projects">Projects</a>
      </div>
    </header>
    {!dataReady ? <div className="vy-task-empty">Task data is temporarily unavailable. Try refreshing in a moment.</div>
      : <>
        {buckets.map((bucket) => <section className="vy-task-group" key={bucket.name} aria-label={`${bucket.name}, ${bucket.tasks.length}`}>
          <h2>{bucket.name} <span className="vy-task-count">{bucket.tasks.length}</span></h2>
          {list(bucket.tasks)}
        </section>)}
        {!buckets.length && <div className="vy-task-empty">Nothing assigned to you right now.</div>}
        {delegated.length > 0 && <section className="vy-task-group" aria-label={`You asked others to do, ${delegated.length}`}>
          <h2>You asked others to do</h2>
          {list(delegated)}
        </section>}
      </>}
  </>
}
