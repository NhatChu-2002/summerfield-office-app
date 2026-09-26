import { useEffect, useState } from 'react'
import { currentPeriod, type LiveReportType } from './live-period'

export function useCurrentReportPeriod(type: LiveReportType) {
  const [period, setPeriod] = useState(() => currentPeriod(type))

  useEffect(() => {
    const refresh = () => setPeriod((previous) => {
      const next = currentPeriod(type)
      return previous.type === next.type && previous.start === next.start ? previous : next
    })
    refresh()
    const timeout = window.setTimeout(() => {
      refresh()
      interval = window.setInterval(refresh, 60_000)
    }, 60_000 - Date.now() % 60_000)
    let interval: number | undefined
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [type])

  return period
}
