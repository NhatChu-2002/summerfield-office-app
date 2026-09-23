import type { ReactNode } from 'react'

// A control from Vy's design whose workflow hasn't been migrated yet. It stays visible but can't be used.
export function ComingSoonButton({ children }: { children: ReactNode }) {
  return <button type="button" className="vy-button vy-button-small" disabled title="Available in a later migration phase">{children}</button>
}
