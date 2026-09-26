import { firstMissing, requiredVisitFields, safetyKey, scoreKey, type InspectionForm } from './form-model.ts'
import { activeLanes, safetyItems } from './template.ts'

export type WalkthroughSection = 'details' | 'arrival' | 'order' | 'safety' | 'review' | 'ops' | 'kiosk' | 'rd' | 'eq' | 'mkt' | 'dt'
export type SectionProgress = {
  key: WalkthroughSection
  label: string
  group: 'Visit' | 'Inspect' | 'Finish'
  answered: number
  total: number
  complete: boolean
}

export function walkthroughProgress(form: InspectionForm): { sections: SectionProgress[]; answered: number; total: number } {
  const visit = ([
    ['details', 'Store details'], ['arrival', 'Arrival'], ['order', 'Your order'],
  ] as const).map(([key, label]) => {
    const fields = requiredVisitFields.filter((entry) => entry.section === key)
    const answered = fields.filter((entry) => form.meta[entry.field].trim()).length
    return { key, label, group: 'Visit' as const, answered, total: fields.length, complete: answered === fields.length }
  })
  const safetyAnswered = safetyItems.filter((_item, index) => !!form.safety[safetyKey(index)]?.value).length
  const safety: SectionProgress = {
    key: 'safety', label: 'Food safety', group: 'Inspect',
    answered: safetyAnswered, total: safetyItems.length, complete: safetyAnswered === safetyItems.length,
  }
  const checks = activeLanes(form.meta.hasDT === 'yes').map((lane) => {
    const answered = lane.items.filter((_item, index) => form.scores[scoreKey(lane.id, index)]?.value !== null && form.scores[scoreKey(lane.id, index)]?.value !== undefined).length
    return {
      key: lane.id as WalkthroughSection, label: lane.name, group: 'Inspect' as const,
      answered, total: lane.items.length, complete: answered === lane.items.length,
    }
  })
  const required = [...visit, safety, ...checks]
  const answered = required.reduce((sum, item) => sum + item.answered, 0)
  const total = required.reduce((sum, item) => sum + item.total, 0)
  return {
    sections: [...required, { key: 'review', label: 'Review & actions', group: 'Finish', answered: 0, total: 0, complete: firstMissing(form) === null }],
    answered, total,
  }
}
