import type { ReactNode } from 'react'

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="vy-panel"><div className="vy-panel-head"><h2>{title}</h2>{action}</div>{children}</section>
}
