import type { InspectionForm, ScoreValue, SafetyValue } from '../form-model'
import { laneStats, scoreKey, safetyKey } from '../form-model'
import { healthQuestions, safetyItems, type CheckLane } from '../template'
import type { InspectionPhoto } from '../photos'
import { PhotoEvidence } from './PhotoEvidence'

const scoreChoices: { value: ScoreValue; label: string }[] = [
  { value: 2, label: 'Good' }, { value: 1, label: 'Partial' },
  { value: 0, label: 'Fail' }, { value: 'na', label: 'N/A' },
]
const safetyChoices: { value: SafetyValue; label: string }[] = [
  { value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }, { value: 'na', label: 'N/A' },
]

export function ChecklistSection({ lane, form, canEdit, editable, onScore, onNote, organizationId, inspectionId, photos, onPhotos, onPhotoBusy }: {
  lane: CheckLane; form: InspectionForm; canEdit: boolean; editable: boolean
  onScore: (key: string, value: ScoreValue) => void; onNote: (key: string, note: string) => void
  organizationId: string; inspectionId: string | null; photos: InspectionPhoto[]; onPhotos: (photos: InspectionPhoto[]) => void; onPhotoBusy: (busy: boolean) => void
}) {
  const stats = laneStats(lane, form)
  return <section className="vy-walk-checklist" aria-label={lane.name}>
    <div className="vy-walk-check-head"><div><span className="vy-walk-kicker">{lane.owner}</span><h2>{lane.name}</h2></div><span>{stats.answered} / {stats.items} answered · {lane.max} points</span></div>
    <div className="vy-walk-check-list">{lane.items.map((item, index) => {
      const key = scoreKey(lane.id, index)
      const answer = form.scores[key]
      return <div className="vy-walk-check" key={key} id={`walk-check-${key}`}>
        <div className="vy-walk-check-copy"><strong>{item.label}</strong>{item.headOffice && <small>May be head office</small>}<p>{item.hint}</p></div>
        <div className="vy-walk-check-answer"><div className="vy-walk-choice" role="group" aria-label={item.label}>{scoreChoices.map((choice) =>
          <button type="button" key={choice.label} aria-pressed={answer?.value === choice.value} disabled={!editable} onClick={() => onScore(key, choice.value)}>{choice.label}</button>
        )}</div></div>
        {(canEdit || answer?.note || photos.some((photo) => photo.question_key === key)) && <details className="vy-walk-check-note"><summary>Notes & photos {photos.filter((photo) => photo.question_key === key).length || ''}</summary><textarea aria-label={`${item.label} notes`} value={answer?.note || ''} onChange={(event) => onNote(key, event.target.value)} disabled={!editable} rows={2} maxLength={2000} placeholder="What you saw" /><PhotoEvidence organizationId={organizationId} inspectionId={inspectionId} questionKey={key} questionLabel={item.label} photos={photos} canEdit={canEdit} editable={editable} onPhotos={onPhotos} onBusy={onPhotoBusy} /></details>}
      </div>
    })}</div>
  </section>
}

export function SafetySection({ form, canEdit, editable, onSafety, onNote, organizationId, inspectionId, photos, onPhotos, onPhotoBusy }: {
  form: InspectionForm; canEdit: boolean; editable: boolean
  onSafety: (key: string, value: SafetyValue) => void; onNote: (key: string, note: string) => void
  organizationId: string; inspectionId: string | null; photos: InspectionPhoto[]; onPhotos: (photos: InspectionPhoto[]) => void; onPhotoBusy: (busy: boolean) => void
}) {
  const failed = safetyItems.filter((_item, index) => form.safety[safetyKey(index)]?.value === 'fail').length
  return <section className="vy-walk-checklist" aria-label="Food safety and hygiene">
    <div className="vy-walk-check-head"><div><span className="vy-walk-kicker">Not scored · safety gate</span><h2>Food safety and hygiene</h2></div></div>
    <p className="vy-walk-message">Any failure must be escalated to the owner the same day and recorded separately from the score.</p>
    {failed > 0 && <p className="vy-walk-safety-alert" role="status">{failed} safety {failed === 1 ? 'failure needs' : 'failures need'} same-day escalation.</p>}
    <div className="vy-walk-check-list">{safetyItems.map((item, index) => {
      const key = safetyKey(index)
      const answer = form.safety[key]
      return <div className="vy-walk-check" key={key} id={`walk-check-${key}`}>
        <div className="vy-walk-check-copy"><strong>{item.label}</strong><p>{item.hint}</p></div>
        <div className="vy-walk-check-answer"><div className="vy-walk-choice" role="group" aria-label={item.label}>{safetyChoices.map((choice) =>
          <button type="button" key={choice.label} aria-pressed={answer?.value === choice.value} disabled={!editable} onClick={() => onSafety(key, choice.value)}>{choice.label}</button>
        )}</div></div>
        {(canEdit || answer?.note || photos.some((photo) => photo.question_key === key)) && <details className="vy-walk-check-note"><summary>Notes & photos {photos.filter((photo) => photo.question_key === key).length || ''}</summary><textarea aria-label={`${item.label} notes`} value={answer?.note || ''} onChange={(event) => onNote(key, event.target.value)} disabled={!editable} rows={2} maxLength={2000} placeholder="What you found and what was done" /><PhotoEvidence organizationId={organizationId} inspectionId={inspectionId} questionKey={key} questionLabel={item.label} photos={photos} canEdit={canEdit} editable={editable} onPhotos={onPhotos} onBusy={onPhotoBusy} /></details>}
      </div>
    })}</div>
    <details className="vy-walk-health-questions"><summary>Health questions for two crew members</summary><ul>{healthQuestions.map((question) => <li key={question}>{question}</li>)}</ul></details>
  </section>
}
