import type { ReactNode } from 'react'

export function Notice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' | 'success' }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}
