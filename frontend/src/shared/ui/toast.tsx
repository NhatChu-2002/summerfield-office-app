import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const ToastContext = createContext<((message: string) => void) | null>(null)

// One short status message at a time, cleared after a few seconds.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])
  const show = useCallback((next: string) => setMessage(next), [])
  return <ToastContext.Provider value={show}>
    {children}
    {message && <div className="toast" role="status">{message}</div>}
  </ToastContext.Provider>
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside ToastProvider.')
  return show
}
