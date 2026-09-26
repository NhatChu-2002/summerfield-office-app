export type LiveReportType = 'weekly' | 'monthly'
export type ReportPeriod = { type: LiveReportType; start: string; end: string; label: string }

function dateParts(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date).filter((part) => part.type !== 'literal').map((part) => part.value).join('-')
}

function iso(date: Date): string { return date.toISOString().slice(0, 10) }
function utcDate(value: string): Date { return new Date(`${value}T00:00:00Z`) }
function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(utcDate(value).getTime()) && iso(utcDate(value)) === value }

export function currentPeriod(type: LiveReportType, now = new Date()): ReportPeriod {
  const today = dateParts(now)
  if (type === 'monthly') return periodFromToken(type, today.slice(0, 7))!
  const date = utcDate(today)
  date.setUTCDate(date.getUTCDate() - date.getUTCDay())
  return periodFromToken(type, iso(date))!
}

export function periodFromToken(type: LiveReportType, token: string): ReportPeriod | null {
  if (type === 'monthly') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(token)) return null
    const [year, month] = token.split('-').map(Number)
    const start = `${token}-01`
    const end = iso(new Date(Date.UTC(year, month, 0)))
    return { type, start, end, label: utcDate(start).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }
  }
  if (!validDate(token)) return null
  const date = utcDate(token)
  if (date.getUTCDay() !== 0) return null
  const end = new Date(date)
  end.setUTCDate(end.getUTCDate() + 6)
  return periodFromDates(type, token, iso(end))
}

export function periodFromDates(type: LiveReportType, start: string, end: string): ReportPeriod | null {
  if (!validDate(start) || !validDate(end) || end < start) return null
  if (type === 'monthly') return { type, start, end, label: utcDate(start).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }
  return { type, start, end, label: `${utcDate(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - ${utcDate(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` }
}

export function recentPeriods(type: LiveReportType, now = new Date(), count = 12): ReportPeriod[] {
  const current = currentPeriod(type, now)
  return Array.from({ length: count }, (_, index) => {
    const date = utcDate(current.start)
    if (type === 'weekly') date.setUTCDate(date.getUTCDate() - 7 * index)
    else date.setUTCMonth(date.getUTCMonth() - index)
    return periodFromToken(type, type === 'weekly' ? iso(date) : iso(date).slice(0, 7))!
  })
}

export function reportsHref(period: ReportPeriod): string { return `#/reports/${period.type}/${period.type === 'weekly' ? period.start : period.start.slice(0, 7)}` }
export function reportsHomeHref(now = new Date()): string { return reportsHref(currentPeriod('monthly', now)) }
export function reportHref(code: string, period: ReportPeriod, storeId?: string): string {
  return `#/report/${encodeURIComponent(code)}/${period.type}/${period.type === 'weekly' ? period.start : period.start.slice(0, 7)}${storeId ? `?store=${encodeURIComponent(storeId)}` : ''}`
}
