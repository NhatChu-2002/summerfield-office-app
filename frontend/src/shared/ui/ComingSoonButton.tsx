import type { ReactNode } from 'react'

// A control from Vy's design whose workflow hasn't been migrated yet. It stays visible but can't be used.
export function ComingSoonButton({ children, small = true }: { children: ReactNode; small?: boolean }) {
  return <button type="button" className={`vy-button ${small ? 'vy-button-small' : ''}`} disabled title="Available in a later migration phase">{children}</button>
}
