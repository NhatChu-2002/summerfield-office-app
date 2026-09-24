import type { WatchAlert } from './model'

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Example messages for the design preview only; no inbox is read.
export const previewAlerts: WatchAlert[] = [
  { id: 'example-alert-1', kind: 'alert', subject: 'Example: a new tea shop nearby', sender: 'Sample Google Alert', date: daysAgo(2), snippet: 'A nearby shop has announced its opening. This sample shows how an industry alert would appear.' },
  { id: 'example-review-1', kind: 'review', subject: 'Example: customer feedback', sender: 'Sample review notice', date: daysAgo(4), snippet: 'A customer mentioned a long wait at pickup. This sample shows how a review notification would appear.' },
]
