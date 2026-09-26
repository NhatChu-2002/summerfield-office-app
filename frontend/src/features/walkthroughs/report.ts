import type { InspectionForm, ScoreValue } from './form-model.ts'
import { inspectionStats, scoreKey, safetyKey } from './form-model.ts'
import { activeLanes, safetyItems, teamNotes } from './template.ts'

export type ReportLine = { kind: 'heading' | 'body' | 'bullet'; text: string }

const answerLabel = (value: ScoreValue | null) => value === 2 ? 'Good' : value === 1 ? 'Partial' : value === 0 ? 'Fail' : value === 'na' ? 'N/A' : 'Not answered'

export function inspectionReport(storeName: string, visitDate: string, form: InspectionForm, copy: 'manager' | 'internal'): ReportLine[] {
  const lines: ReportLine[] = []
  const heading = (text: string) => lines.push({ kind: 'heading', text })
  const body = (text: string) => lines.push({ kind: 'body', text })
  const bullet = (text: string) => lines.push({ kind: 'bullet', text })
  const meta = form.meta
  const stats = inspectionStats(form)
  heading('Store details')
  body(`Store: ${storeName}`); body(`Visit date: ${visitDate}`)
  body(`Arrival time: ${meta.time || '-'}`); body(`Manager on site: ${meta.mgrName || '-'}`)
  if (copy === 'internal') body(`Inspected by: ${meta.inspectors || '-'}`)
  body(`Address: ${meta.geo || '-'}`)
  heading('Arrival and order')
  body(`Guests ahead: ${meta.queue || '-'}`); body(`Wait to order: ${meta.waitOrder || '-'}`)
  body(`Wait for drink: ${meta.waitDrink || '-'}`); body(`Crew on shift: ${meta.crew || '-'}`)
  body(`Order channel: ${meta.channel || '-'}`); body(`Order: ${meta.orderItems || '-'}`)
  body(`Order total: ${meta.orderTotal || '-'}`)
  if (meta.hasDT === 'yes') body(`Drive-thru: ${meta.dtCars || '-'} cars ahead; speaker to window ${meta.dtSpeaker || '-'}s; window to hand-off ${meta.dtWindow || '-'}s; total ${meta.dtTotal || '-'}s`)
  heading('Score')
  body(`${stats.complete ? 'Final' : 'Running'} score: ${stats.score === null ? 'Not started' : `${stats.score} / 100`}`)
  body(`Grade: ${stats.grade || 'Not final'}`)
  body(`Food safety: ${stats.safetyAnswered} of ${safetyItems.length} answered; ${stats.safetyFails} failed. Safety is not scored.`)
  heading('Section results')
  stats.sections.forEach((section) => bullet(`${section.lane.name}: ${section.answered}/${section.items} answered; ${section.failed} failed; ${section.partial} partial; ${section.points === null ? 'no score' : `${section.points.toFixed(1)} / ${section.lane.max}`}`))
  const safetyEvidence = safetyItems.map((item, index) => ({ item, answer: form.safety[safetyKey(index)] })).filter(({ answer }) => answer?.value || answer?.note)
  if (safetyEvidence.length) {
    heading('Food safety evidence')
    safetyEvidence.forEach(({ item, answer }) => bullet(`${item.label}: ${answer.value || 'Not answered'}${answer.note ? ` | ${answer.note}` : ''}`))
  }
  const exceptions = activeLanes(meta.hasDT === 'yes').flatMap((lane) => lane.items.flatMap((item, index) => {
    const answer = form.scores[scoreKey(lane.id, index)]
    return answer && (answer.value === 0 || answer.value === 1 || answer.note)
      ? [`${item.label}: ${answerLabel(answer.value)}${answer.note ? ` | ${answer.note}` : ''}`] : []
  }))
  if (exceptions.length) { heading('Exceptions and notes'); exceptions.forEach(bullet) }
  heading('Findings and actions')
  const findings = form.findings.filter((finding) => finding.text.trim() || finding.owner.trim() || finding.due)
  if (findings.length) findings.forEach((finding, index) => bullet(`Finding ${index + 1}: ${finding.text || '-'} | Owner: ${finding.owner || '-'} | Due: ${finding.due || '-'}`))
  else body('No findings recorded.')
  body(`Follow-up by: ${meta.followBy || '-'}`); body(`Follow-up due: ${meta.followDate || '-'}`)
  if (copy === 'internal') {
    heading('Manager discussion')
    body(`What went well: ${meta.q1 || '-'}`); body(`What did not: ${meta.q2 || '-'}`)
    body(`What they preferred we did not see: ${meta.q3 || '-'}`)
    heading('Internal team notes')
    teamNotes.forEach(([key, label]) => { if (meta[`team_${key}`]) bullet(`${label}: ${meta[`team_${key}`]}`) })
  }
  return lines
}
