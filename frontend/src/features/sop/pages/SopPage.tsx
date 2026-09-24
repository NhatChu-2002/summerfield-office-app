import { useState } from 'react'
import { FilePlus2, FileText, Trash2 } from 'lucide-react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { SopChecklist } from '../components/SopChecklist'
import { SopEditor } from '../components/SopEditor'
import { blankSop, safeSopUrl, sopText, sopTypes, type SopDraft, type SopType } from '../model'
import './sop.css'

export default function SopPage({ departments, drafts, preview, onDraftsChange }: {
  departments: ReferenceDepartment[]
  drafts: SopDraft[]
  preview: boolean
  onDraftsChange?: (drafts: SopDraft[]) => void
}) {
  const [notes, setNotes] = useState('')
  const [department, setDepartment] = useState('')
  const [type, setType] = useState<SopType>('Procedure')
  const [titleHint, setTitleHint] = useState('')
  const [libraryDepartment, setLibraryDepartment] = useState('')
  const [working, setWorking] = useState<SopDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const selected = working && drafts.some((item) => item.id === working.id)
  const shown = drafts.filter((item) => !libraryDepartment || item.department === libraryDepartment)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  function open(next: SopDraft) {
    if (dirty && !window.confirm('Discard unsaved changes to this preview draft?')) return
    setWorking(next)
    setDirty(false)
    setMessage('')
  }
  function change(next: SopDraft) {
    setWorking(next.status === 'draft' ? next : { ...next, status: 'draft', filedUrl: '' })
    setDirty(true)
    setMessage('')
  }
  function save(next = working) {
    if (!next) return
    const updated = { ...next, updatedAt: new Date().toISOString() }
    onDraftsChange?.(drafts.some((item) => item.id === next.id) ? drafts.map((item) => item.id === next.id ? updated : item) : [updated, ...drafts])
    setWorking(updated)
    setDirty(false)
    setMessage('Preview draft saved in this browser session.')
  }
  async function copy() {
    if (!working) return
    try { await navigator.clipboard.writeText(sopText(working)); setMessage('SOP text copied.') }
    catch { setMessage('Copy was blocked by the browser. Select the text from the editor instead.') }
  }
  function updateStatus(status: 'ready' | 'filed', filedUrl = '') {
    if (!working) return
    save({ ...working, status, filedUrl })
    setMessage(status === 'filed' ? 'Marked filed in this preview only. No Drive upload occurred.' : 'Marked ready in this preview only.')
  }

  return <>
    <header className="vy-hero vy-sop-hero"><div><h1>SOP Studio</h1><p>Shape rough notes into the Summerfield house format, review what is missing, and prepare a filing handoff.</p></div><div className="vy-hero-actions"><button type="button" className="vy-button vy-button-dark" disabled={!preview} onClick={() => open(blankSop())}><FilePlus2 size={16} /> Start blank form</button></div></header>
    <p className="vy-sop-status">{preview ? 'Design preview only. Drafts and edits stay in memory until you reload; nothing is uploaded, filed, or approved.' : 'Shared SOP drafts are not connected yet. No company SOP data is shown.'}</p>
    {message && <p className="vy-sop-message" role="status">{message}</p>}
    <div className="vy-sop-layout">
      <div className="vy-sop-main">
        <section className="vy-sop-start" aria-labelledby="vy-sop-start-title"><h2 id="vy-sop-start-title">1. Add your raw SOP material</h2>
          <div className="vy-sop-upload"><FileText size={20} aria-hidden="true" /><div><strong>PDF, Word, and photo import</strong><span>File parsing and AI writing are not connected in this React view.</span></div><button type="button" className="vy-button vy-button-small" disabled>Choose files</button></div>
          <label>Or paste notes, a checklist, or an old SOP<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} disabled={!preview} placeholder="Anything that explains how the task is done today..." /></label>
          <div className="vy-sop-start-grid"><label>Department<SelectField value={department} onChange={setDepartment} disabled={!preview} options={[{ value: '', label: 'Choose department' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} /></label>
            <label>SOP type<SelectField value={type} onChange={(value) => setType(value as SopType)} disabled={!preview} options={sopTypes.map((item) => ({ value: item, label: item }))} /></label>
            <label>Title (optional)<input value={titleHint} onChange={(event) => setTitleHint(event.target.value)} disabled={!preview} maxLength={140} placeholder="e.g. Closing checklist" /></label></div>
          <div className="vy-sop-start-actions"><button type="button" className="vy-button vy-button-dark" disabled title="Claude SOP generation is not connected">Build with Claude</button><button type="button" className="vy-button" disabled={!preview} onClick={() => open({ ...blankSop(department, notes, type), title: titleHint.trim() })}>Use notes in a blank form</button></div>
        </section>
        {working && preview && <SopEditor sop={working} departments={allDepartments} saved={!!selected && !dirty} onChange={change} onSave={() => save()} onCopy={() => void copy()} onClose={() => { if (dirty && !window.confirm('Discard unsaved changes to this preview draft?')) return; setWorking(null); setDirty(false) }} />}
      </div>
      <aside className="vy-sop-side">
        {working && preview && <SopChecklist key={working.id} sop={working} departments={allDepartments} saved={!!selected && !dirty} onReady={() => updateStatus('ready')} onFiled={(url) => updateStatus('filed', url)} />}
        <section className="vy-sop-library" aria-labelledby="vy-sop-library-title"><div className="vy-sop-section-head"><h2 id="vy-sop-library-title">Team SOP drafts</h2><SelectField ariaLabel="Filter drafts by department" size="compact" value={libraryDepartment} onChange={setLibraryDepartment} options={[{ value: '', label: 'All departments' }, ...allDepartments.map((item) => ({ value: item.code, label: item.name }))]} /></div>
          {shown.length ? <ul>{shown.map((draft) => {
            const team = allDepartments.find((item) => item.code === draft.department)
            const link = safeSopUrl(draft.filedUrl)
            return <li key={draft.id}><div><strong>{draft.title || 'Untitled SOP'}</strong><p>{draft.sopNumber || 'No number'} · {team && <><span className="vy-sop-team" style={departmentStyle(team.color)}>{team.name}</span> · </>}{draft.status === 'ready' ? 'Ready to file' : draft.status === 'filed' ? 'Filed in preview' : 'Draft'} · {displayDate(draft.updatedAt)}</p></div><div className="vy-sop-library-actions">{link && <a className="vy-button vy-button-small" href={link} target="_blank" rel="noopener noreferrer">Open link</a>}<button type="button" className="vy-button vy-button-small" onClick={() => open(draft)}>Open</button><button type="button" className="vy-sop-icon-button" title="Delete draft" aria-label={`Delete ${draft.title || 'untitled draft'}`} onClick={() => { if (!window.confirm('Delete this preview draft?')) return; onDraftsChange?.(drafts.filter((item) => item.id !== draft.id)); if (working?.id === draft.id) { setWorking(null); setDirty(false) } }}><Trash2 size={14} /></button></div></li>
          })}</ul> : <p className="vy-sop-empty">{preview ? 'No SOP drafts yet.' : 'Shared SOP drafts will appear when storage is connected.'}</p>}
        </section>
      </aside>
    </div>
  </>
}
