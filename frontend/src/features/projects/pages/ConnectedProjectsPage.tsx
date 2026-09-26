import { ArrowUpRight, Plus } from 'lucide-react'
import './projects.css'

export function ConnectedProjectsPage({ canSubmitStoreTicket, liveTaskStats }: {
  canSubmitStoreTicket: boolean
  liveTaskStats?: { overdue: number; mine: number }
}) {
  return <div className="vy-project-live">
    <header className="vy-hero vy-projects-hero">
      <div><h1>Projects</h1><p>Store tickets and team tasks.</p></div>
      <div className="vy-hero-actions"><a className="vy-button" href="#/tasks">My tasks <ArrowUpRight size={15} /></a></div>
    </header>

    <section className="vy-project-live-section" aria-labelledby="vy-live-tickets-title">
      <div>
        <h2 id="vy-live-tickets-title">Ticket desk</h2>
        <p>Store issues you reported, were assigned, or can review.</p>
      </div>
      <div className="vy-project-live-actions">
        <a className="vy-button" href="#/tickets">Open ticket desk <ArrowUpRight size={15} /></a>
        {canSubmitStoreTicket && <a className="vy-button vy-button-dark" href="#/tickets/new"><Plus size={15} /> Submit ticket</a>}
      </div>
    </section>

    <section className="vy-project-live-section" aria-labelledby="vy-live-tasks-title">
      <div>
        <h2 id="vy-live-tasks-title">HQ tasks</h2>
        <p>{liveTaskStats
          ? `${liveTaskStats.mine} assigned to you · ${liveTaskStats.overdue} overdue across visible teams`
          : 'Loading task totals...'}</p>
      </div>
      <div className="vy-project-live-actions"><a className="vy-button" href="#/tasks">Open my tasks <ArrowUpRight size={15} /></a></div>
    </section>

    <section className="vy-project-live-section" aria-labelledby="vy-live-projects-title">
      <div>
        <h2 id="vy-live-projects-title">Shared projects</h2>
        <p>Shared project records are not connected yet.</p>
      </div>
    </section>
  </div>
}
