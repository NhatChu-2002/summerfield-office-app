export type WatchKind = 'alert' | 'review' | 'note'

export type WatchItem = {
  id: string
  title: string
  kind: WatchKind
  department: string
  date: string
  source: string
  url: string
  summary: string
  lesson: string
  sourceId?: string
}

export type WatchDraft = Omit<WatchItem, 'id'>

export type WatchAlert = {
  id: string
  subject: string
  sender: string
  date: string
  snippet: string
  kind: 'alert' | 'review'
}

export type WatchBriefing = { id: string; title: string; date: string; body: string; source?: string }

export function visibleWatchItems(items: WatchItem[], department: string) {
  return items.filter((item) => !department || item.department === department)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function safeWatchUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch { return null }
}
