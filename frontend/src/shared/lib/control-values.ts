export function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined
}

export function formatIsoDate(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseClockTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (hours > 23 || minutes > 59) return null
  return { hour: hours % 12 || 12, minute: minutes, period: hours >= 12 ? 'PM' : 'AM' }
}

export function formatClockTime(hour: number, minute: number, period: string) {
  const hours24 = hour % 12 + (period === 'PM' ? 12 : 0)
  return `${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
