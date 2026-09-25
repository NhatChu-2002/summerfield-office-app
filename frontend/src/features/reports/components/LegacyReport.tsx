import type { LiveReportType } from '../live-period'
import type { Payload } from '../live-schema'
import { legacyReportSections } from '../legacy-reader-model'

export function LegacyReport({ payload, type, departmentCode }: { payload: Payload; type: LiveReportType; departmentCode: string }) {
  const sections = legacyReportSections(payload, type, departmentCode)
  const hasUnmappedControls = Array.isArray(payload.controls) && payload.controls.length > 0 && !payload.named
  return <div className="vy-live-report-legacy">
    <p className="vy-report-locked">This inventory-form report is read-only in HQ. Editing it is not yet supported here.</p>
    {hasUnmappedControls && <p className="vy-report-locked">Some older answers are stored by form position and cannot be labeled reliably here. The original report remains available in the inventory app.</p>}
    {sections.length ? sections.map((section, index) => <section key={`${section.title}-${index}`} aria-label={section.title}>
      <div className="vy-live-report-section-head"><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2></div></div>
      <div className="vy-live-report-read-blocks">{section.blocks.map((block, blockIndex) => <div className="vy-live-report-read-block" key={blockIndex}>
        {block.label && <h3>{block.label}</h3>}
        <dl>{block.fields.map((field, fieldIndex) => <div key={`${field.label}-${fieldIndex}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
      </div>)}</div>
    </section>) : <p className="vy-report-status">No answers were saved in this report.</p>}
  </div>
}
