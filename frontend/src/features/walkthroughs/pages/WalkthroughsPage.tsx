import type { Access } from '@/features/auth'
import { WalkthroughDraft } from '../components/WalkthroughDraft'
import { WalkthroughLibrary } from '../components/WalkthroughLibrary'
import { WalkthroughStart } from '../components/WalkthroughStart'
import { canViewWalkthroughs } from '../model'
import './walkthroughs.css'

export function WalkthroughsPage({ access, mode, storeId, visitDate }: {
  access: Access; mode?: string; storeId?: string; visitDate?: string
}) {
  if (!canViewWalkthroughs(access)) return <div className="vy-walkthroughs vy-walk-empty"><h1>Walk-throughs unavailable</h1><p>No store is assigned to your account.</p></div>
  if (mode === 'new') return <WalkthroughStart access={access} />
  if (storeId && visitDate) return <WalkthroughDraft access={access} storeId={storeId} visitDate={visitDate} />
  return <WalkthroughLibrary access={access} />
}
