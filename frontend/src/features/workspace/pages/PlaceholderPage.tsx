import { ArrowRight } from 'lucide-react'
import { referenceNav } from '@/shared/config/reference-departments'
import { SectionIcon } from '@/shared/ui/icons'

// Sections from Vy's prototype that haven't been rebuilt yet say so plainly instead of faking controls.
export function PlaceholderPage({ page }: { page: string }) {
  const item = referenceNav.find((entry) => entry.key === page)
  return <><header className="vy-hero vy-placeholder-hero"><div><h1><SectionIcon name={item?.key || page} size={32} /> {item?.label || page}</h1><p>This screen is next in the page-by-page React rebuild.</p></div><a className="vy-button" href="#/">Back to dashboard <ArrowRight size={15} /></a></header><div className="vy-placeholder-body"><h2>Design conversion in progress</h2><p>The original HQ prototype has this screen, but its data and controls have not been migrated into the React app. There are no editable controls on this screen yet.</p></div></>
}
