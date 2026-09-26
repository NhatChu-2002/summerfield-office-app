import { useState } from 'react'
import { Check, ChevronDown, List } from 'lucide-react'
import type { SectionProgress, WalkthroughSection } from '../section-progress'

export function WalkthroughSectionNav({ sections, current, answered, total, onSelect }: {
  sections: SectionProgress[]
  current: WalkthroughSection
  answered: number
  total: number
  onSelect: (section: WalkthroughSection) => void
}) {
  const [open, setOpen] = useState(false)
  const currentIndex = Math.max(0, sections.findIndex((item) => item.key === current))
  const selected = sections[currentIndex]
  const choose = (section: WalkthroughSection) => { setOpen(false); onSelect(section) }

  return <aside className="vy-walk-progress">
    <div className="vy-walk-progress-head">
      <div><span>Step {currentIndex + 1} of {sections.length}</span><strong>{selected.label}</strong></div>
      <button type="button" className="vy-walk-progress-toggle" aria-expanded={open} aria-controls="vy-walk-progress-list" onClick={() => setOpen((value) => !value)}><List size={17} /> Sections <ChevronDown size={15} className={open ? 'is-open' : ''} /></button>
    </div>
    <progress value={answered} max={total || 1} aria-label="Required inspection items completed" />
    <p>{answered} of {total} required items completed</p>
    <nav id="vy-walk-progress-list" className={open ? 'is-open' : ''} aria-label="Walk-through sections">
      {(['Visit', 'Inspect', 'Finish'] as const).map((group) => <div className="vy-walk-progress-group" key={group}>
        <span className="vy-walk-progress-group-name">{group}</span>
        {sections.map((item, index) => item.group === group && <button type="button" key={item.key} className="vy-walk-progress-step" aria-current={item.key === current ? 'step' : undefined} onClick={() => choose(item.key)}>
          <span className={`vy-walk-progress-mark${item.complete ? ' is-complete' : ''}`} aria-hidden="true">{item.complete ? <Check size={14} strokeWidth={2.4} /> : index + 1}</span>
          <span className="vy-walk-progress-name">{item.label}</span>
          <span className="vy-walk-progress-count">{item.total ? `${item.answered}/${item.total}` : item.complete ? 'Ready' : ''}</span>
        </button>)}
      </div>)}
    </nav>
  </aside>
}
