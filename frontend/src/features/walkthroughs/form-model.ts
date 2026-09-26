import { readVisitMeta, withVisitMeta, type VisitMeta } from './model.ts'
import { activeLanes, lanes, safetyItems, type CheckLane } from './template.ts'

export type ScoreValue = 0 | 1 | 2 | 'na'
export type SafetyValue = 'pass' | 'fail' | 'na'
export type ScoreAnswer = { value: ScoreValue | null; note: string }
export type SafetyAnswer = { value: SafetyValue | ''; note: string }
export type Finding = { text: string; owner: string; due: string }
export type InspectionForm = {
  meta: VisitMeta
  scores: Record<string, ScoreAnswer>
  safety: Record<string, SafetyAnswer>
  findings: Finding[]
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

export const scoreKey = (laneId: string, index: number) => `${laneId}:${index}`
export const safetyKey = (index: number) => `safe:${index}`

export function readInspection(payload: unknown): InspectionForm {
  const visit = object(object(payload).visit)
  const scores: Record<string, ScoreAnswer> = {}
  for (const lane of lanes) lane.items.forEach((_item, index) => {
    const key = scoreKey(lane.id, index)
    const entry = object(visit[key])
    const value = entry.v
    scores[key] = {
      value: value === 0 || value === 1 || value === 2 || value === 'na' ? value : null,
      note: typeof entry.note === 'string' ? entry.note : '',
    }
  })
  const safety: Record<string, SafetyAnswer> = {}
  safetyItems.forEach((_item, index) => {
    const key = safetyKey(index)
    const value = visit[key]
    safety[key] = {
      value: value === 'pass' || value === 'fail' || value === 'na' ? value : '',
      note: typeof visit[`${key}:note`] === 'string' ? visit[`${key}:note`] as string : '',
    }
  })
  const findings = Array.isArray(visit.findings) ? visit.findings.map((value) => {
    const row = object(value)
    return {
      text: typeof row.text === 'string' ? row.text : '',
      owner: typeof row.owner === 'string' ? row.owner : '',
      due: typeof row.due === 'string' ? row.due : '',
    }
  }) : []
  return { meta: readVisitMeta(payload), scores, safety, findings: findings.length ? findings : [{ text: '', owner: '', due: '' }] }
}

export function withInspection(payload: unknown, form: InspectionForm, storeName: string, visitDate: string): Record<string, unknown> {
  const root = withVisitMeta(payload, form.meta, storeName, visitDate)
  const visit = { ...object(root.visit) }
  for (const [key, answer] of Object.entries(form.scores)) {
    const previous = object(visit[key])
    if (answer.value !== null || answer.note.trim() || Object.keys(previous).length) {
      const next: Record<string, unknown> = { ...previous, note: answer.note }
      if (answer.value === null) delete next.v
      else next.v = answer.value
      visit[key] = next
    }
  }
  for (const [key, answer] of Object.entries(form.safety)) {
    if (answer.value) visit[key] = answer.value
    if (answer.note || `${key}:note` in visit) visit[`${key}:note`] = answer.note
  }
  const previousFindings = Array.isArray(visit.findings) ? visit.findings : []
  visit.findings = form.findings.map((finding, index) => ({ ...object(previousFindings[index]), ...finding }))
  return { ...root, visit }
}

export function laneStats(lane: CheckLane, form: InspectionForm) {
  let got = 0; let possible = 0; let answered = 0; let partial = 0; let failed = 0; let notApplicable = 0
  lane.items.forEach((_item, index) => {
    const value = form.scores[scoreKey(lane.id, index)]?.value
    if (value === null || value === undefined) return
    answered += 1
    if (value === 'na') { notApplicable += 1; return }
    got += value; possible += 2
    if (value === 1) partial += 1
    if (value === 0) failed += 1
  })
  return {
    answered, items: lane.items.length, partial, failed, notApplicable,
    percent: possible ? got / possible * 100 : null,
    points: possible ? got / possible * lane.max : null,
    complete: answered === lane.items.length,
  }
}

export function inspectionStats(form: InspectionForm) {
  const sections = activeLanes(form.meta.hasDT === 'yes').map((lane) => ({ lane, ...laneStats(lane, form) }))
  const points = sections.reduce((sum, section) => sum + (section.points ?? 0), 0)
  const available = sections.reduce((sum, section) => sum + (section.points === null ? 0 : section.lane.max), 0)
  const safetyAnswered = safetyItems.filter((_item, index) => !!form.safety[safetyKey(index)]?.value).length
  const safetyFails = safetyItems.filter((_item, index) => form.safety[safetyKey(index)]?.value === 'fail').length
  const score = available ? Math.round(points / available * 100) : null
  const complete = sections.every((section) => section.complete) && safetyAnswered === safetyItems.length
  return {
    sections, score, grade: complete && score !== null ? score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F' : null,
    complete, safetyAnswered, safetyFails,
    answered: sections.reduce((sum, section) => sum + section.answered, 0),
    items: sections.reduce((sum, section) => sum + section.items, 0),
  }
}

export function firstMissing(form: InspectionForm): { section: string; label: string } | null {
  const required: { field: keyof VisitMeta; label: string; section: string }[] = [
    { field: 'geo', label: 'Address at time of visit', section: 'details' },
    { field: 'time', label: 'Arrival time', section: 'details' },
    { field: 'mgrName', label: 'Store manager on site', section: 'details' },
    { field: 'queue', label: 'Guests ahead in line', section: 'arrival' },
    { field: 'waitOrder', label: 'Wait to place the order', section: 'arrival' },
    { field: 'waitDrink', label: 'Wait for the drink', section: 'arrival' },
    { field: 'crew', label: 'Crew on shift', section: 'arrival' },
    { field: 'channel', label: 'Order channel', section: 'order' },
    { field: 'orderTime', label: 'Order placed at', section: 'order' },
    { field: 'readyTime', label: 'Handed to you at', section: 'order' },
    { field: 'orderTotal', label: 'Order total', section: 'order' },
    { field: 'orderItems', label: 'What you ordered', section: 'order' },
  ]
  for (const entry of required) if (!form.meta[entry.field].trim()) return { section: entry.section, label: entry.label }
  for (let index = 0; index < safetyItems.length; index += 1) {
    if (!form.safety[safetyKey(index)]?.value) return { section: 'safety', label: safetyItems[index].label }
  }
  for (const lane of activeLanes(form.meta.hasDT === 'yes')) for (let index = 0; index < lane.items.length; index += 1) {
    const value = form.scores[scoreKey(lane.id, index)]?.value
    if (value === null || value === undefined) return { section: lane.id, label: lane.items[index].label }
  }
  return null
}

export function inspectionSummary(storeName: string, form: InspectionForm): string {
  const stats = inspectionStats(form)
  const first = form.findings.find((finding) => finding.text.trim())
  return [storeName, stats.score === null ? 'Not scored' : `${stats.score}%`, first?.text || ''].filter(Boolean).join(' | ').slice(0, 500)
}
