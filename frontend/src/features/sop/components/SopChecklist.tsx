import { useState } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { safeSopUrl, sopChecks, type SopDraft } from '../model'

export function SopChecklist({ sop, departments, saved, onReady, onFiled }: {
  sop: SopDraft
  departments: ReferenceDepartment[]
  saved: boolean
  onReady: () => void
  onFiled: (url: string) => void
}) {
  const [filedUrl, setFiledUrl] = useState(sop.filedUrl)
  const [error, setError] = useState('')
  const checks = sopChecks(sop)
  const passed = checks.filter((item) => item.ok).length
  const complete = passed === checks.length
  const team = departments.find((item) => item.code === sop.department)

  function file() {
    if (!complete) { setError('Finish the house-format checklist before filing.'); return }
    if (!safeSopUrl(filedUrl)) { setError('Enter an http or https link to the filed SOP.'); return }
    onFiled(filedUrl.trim())
    setError('')
  }

  return <section className="vy-sop-checklist" aria-labelledby="vy-sop-checklist-title">
    <h2 id="vy-sop-checklist-title">Completeness</h2>
    <div className="vy-sop-meter" role="progressbar" aria-label="House format complete" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={passed}><span style={{ width: `${passed / checks.length * 100}%` }} /></div>
    <p>{passed} of {checks.length} house requirements met</p>
    <ul>{checks.map((check) => <li key={check.key} className={check.ok ? 'is-ok' : ''}>{check.ok && <Check size={14} aria-hidden="true" />}{check.label}</li>)}</ul>
    <button type="button" className="vy-button vy-button-small" disabled={!saved || !complete || sop.status === 'ready' || sop.status === 'filed'} title={!saved ? 'Save the draft first' : !complete ? 'Complete the checklist first' : undefined} onClick={onReady}>Mark ready to file</button>
    <div className="vy-sop-filing"><h2>3. Where to file it</h2><p>{team ? `Confirm the approved SOP folder for ${team.name} in Department folders.` : 'Choose a department to find its approved SOP folder.'} The preview does not upload to Drive.</p><a href="#/folders" className="vy-sop-folder-link"><ExternalLink size={14} /> Department folders</a>
      <label>Drive link to the filed SOP<input type="url" value={filedUrl} onChange={(event) => { setFiledUrl(event.target.value); setError('') }} placeholder="https://drive.google.com/..." /></label>
      {error && <p role="alert" className="vy-sop-error">{error}</p>}
      <button type="button" className="vy-button vy-button-small" disabled={!saved || !complete} onClick={file}>Mark filed in preview</button>
      {sop.status === 'filed' && sop.filedUrl && <a href={safeSopUrl(sop.filedUrl)} target="_blank" rel="noopener noreferrer">Open filed link</a>}
    </div>
  </section>
}
