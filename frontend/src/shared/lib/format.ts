export function displayDate(value: string | null, withYear = false) {
  if (!value) return 'No due date'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
    : new Date(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })
}

export function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return displayDate(value, true)
}

export function todayLocal() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase()
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
