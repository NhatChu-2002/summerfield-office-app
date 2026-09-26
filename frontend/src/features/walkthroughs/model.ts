import type { Access } from '@/features/auth'

export type VisitMeta = {
  geo: string
  time: string
  mgrName: string
  inspectors: string
  hasDT: 'yes' | 'no'
  queue: string
  waitOrder: string
  waitDrink: string
  crew: string
  channel: string
  orderTime: string
  readyTime: string
  orderTotal: string
  orderItems: string
  dtCars: string
  dtSpeaker: string
  dtWindow: string
  dtTotal: string
}

export const orderChannels = [
  'Counter — staff took the order',
  'Self-order kiosk',
  'Drive-thru',
  'Mobile app / delivery',
] as const

const metaFields: (keyof VisitMeta)[] = [
  'geo', 'time', 'mgrName', 'inspectors', 'hasDT', 'queue', 'waitOrder',
  'waitDrink', 'crew', 'channel', 'orderTime', 'readyTime', 'orderTotal',
  'orderItems', 'dtCars', 'dtSpeaker', 'dtWindow', 'dtTotal',
]

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function canViewWalkthroughs(access: Access): boolean {
  return access.organization.role === 'admin'
    || access.organization.stores.length > 0
    || access.assignments.some((item) => item.team_role === 'lead' && (item.department_code === 'operations' || item.department_code === 'store_manager'))
}

export function readVisitMeta(payload: unknown): VisitMeta {
  const stored = object(object(object(payload).visit).meta)
  const result: Record<string, string> = {}
  for (const field of metaFields) result[field] = typeof stored[field] === 'string' ? stored[field] as string : ''
  return { ...result, hasDT: stored.hasDT === 'yes' ? 'yes' : 'no' } as VisitMeta
}

export function withVisitMeta(payload: unknown, meta: VisitMeta, storeName: string, visitDate: string): Record<string, unknown> {
  const root = object(payload)
  const visit = object(root.visit)
  const previous = object(visit.meta)
  return { ...root, visit: { ...visit, meta: {
    ...previous, ...meta, store: typeof previous.store === 'string' && previous.store ? previous.store : storeName,
    date: visitDate,
  } } }
}

export function validVisitDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function todayInLosAngeles(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (name: string) => parts.find((part) => part.type === name)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function walkthroughMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Walk-through service is unavailable.'
  if (/Could not find the function public\.|schema cache|relation ["']public\.store_inspections["'] does not exist/i.test(message)) {
    return 'Store walk-through setup is not complete in this environment. Ask an administrator to apply the inspection migration.'
  }
  return message
}
