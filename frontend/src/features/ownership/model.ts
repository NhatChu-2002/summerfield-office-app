export type Person = { id: string; name: string }

export type OwnershipArea = {
  id: string
  topic: string
  department: string
  owner: string
  backup: string
  how: string
  sla: string
  keywords: string[]
  sop: string
  notes: string
}

export type ContactProfile = {
  id: string
  title: string
  department: string
  phone: string
  email: string
  best: string
  hours: string
  based: string
  backup: string
  notes: string
}

export type DecisionRule = {
  id: string
  group: string
  decision: string
  department: string
  decider: string
  limit: string
  escalate: string
  consult: string
  inform: string
  keywords: string[]
  notes: string
}

export const contactMethods = [
  { value: 'ticket', label: 'Submit a ticket in HQ' },
  { value: 'message', label: 'Message them in the project chat' },
  { value: 'asana', label: 'Asana task plus an email' },
  { value: 'call', label: 'Call or text (urgent)' },
  { value: 'meeting', label: 'Raise it at the weekly meeting' },
]

export const decisionGroups = ['Money', 'Stores', 'Equipment', 'People', 'Menu', 'Marketing', 'Process']

const normalized = (value: string) => value.toLocaleLowerCase().trim()

export function areaScore(area: OwnershipArea, query: string): number {
  const text = normalized(query)
  if (!text) return 0
  const words = text.split(/[^a-z0-9]+/).filter((word) => word.length > 2)
  let score = normalized(area.topic) && text.includes(normalized(area.topic)) ? 6 : 0
  for (const keyword of area.keywords) {
    const key = normalized(keyword)
    if (!key) continue
    if (text.includes(key)) score += key.includes(' ') ? 5 : 3
    else if (words.some((word) => key.startsWith(word) || word.startsWith(key))) score += 1
  }
  return score
}

export function matchingAreas(areas: OwnershipArea[], query: string, department = ''): OwnershipArea[] {
  const text = normalized(query)
  return areas.filter((area) => (!department || area.department === department)
    && (!text || areaScore(area, text) > 0 || normalized(area.topic).includes(text)))
    .sort((a, b) => areaScore(b, text) - areaScore(a, text) || a.topic.localeCompare(b.topic))
}

export function suggestedArea(areas: OwnershipArea[], query: string): OwnershipArea | undefined {
  return areas.map((area) => ({ area, score: areaScore(area, query) }))
    .filter(({ score }) => score >= 3).sort((a, b) => b.score - a.score)[0]?.area
}

export function decisionScore(rule: DecisionRule, query: string): number {
  const text = normalized(query)
  if (!text) return 0
  let score = 0
  for (const keyword of rule.keywords) {
    const key = normalized(keyword)
    if (key && text.includes(key)) score += key.includes(' ') ? 4 : 2
  }
  if (normalized(rule.decision) && text.includes(normalized(rule.decision))) score += 6
  if (normalized(rule.group) && text.includes(normalized(rule.group))) score += 3
  return score
}

export function parseDecisionLimit(limit: string): { min: number; max: number } | null {
  const values = (limit.match(/\$?\s?[\d,]+(?:\.\d+)?/g) || [])
    .map((part) => Number(part.replace(/[^0-9.]/g, ''))).filter(Number.isFinite)
  if (!values.length) return null
  if (/over|above|more than|goes up|beyond/i.test(limit)) return { min: values[0], max: Infinity }
  return values.length > 1 ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: values[0] }
}

export function matchingDecisions(rules: DecisionRule[], query: string): DecisionRule[] {
  return rules.map((rule) => ({ rule, score: decisionScore(rule, query) }))
    .filter(({ score }) => score >= 2).sort((a, b) => b.score - a.score).map(({ rule }) => rule)
}

export function decisionAnswer(rules: DecisionRule[], query: string, amountInput: string) {
  const matches = matchingDecisions(rules, query)
  if (!matches.length) return null
  const amountText = amountInput || query.match(/\$\s?[\d,]+(?:\.\d+)?/)?.[0] || ''
  const amount = amountText ? Number(amountText.replace(/[^0-9.]/g, '')) : NaN
  const inBand = Number.isFinite(amount) ? matches.find((rule) => {
    const band = parseDecisionLimit(rule.limit)
    return band && amount >= band.min && amount <= band.max
  }) : undefined
  const rule = inBand || (Number.isFinite(amount)
    ? [...matches].filter((item) => parseDecisionLimit(item.limit))
      .sort((a, b) => parseDecisionLimit(b.limit)!.max - parseDecisionLimit(a.limit)!.max)[0] || matches[0]
    : matches[0])
  const band = parseDecisionLimit(rule.limit)
  return { rule, amount, over: !!(band && Number.isFinite(amount) && amount > band.max) }
}

export function safeSopUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch { return null }
}
