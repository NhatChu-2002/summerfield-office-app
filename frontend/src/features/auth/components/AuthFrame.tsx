import type { ReactNode } from 'react'
import { Hand } from 'lucide-react'
import { SunnyCharacter } from '@/features/sunny'

export function AuthFrame({ children }: { children: ReactNode }) {
  return <div className="auth-page">
    <main className="auth-panel">
      <div className="auth-sunny-row">
        <span className="auth-sunny" role="img" aria-label="Sunny, the Summerfield mascot, waving"><SunnyCharacter motion="greet" /></span>
        <span className="auth-bubble" aria-hidden="true">Hi! <Hand size={18} strokeWidth={1.8} /></span>
      </div>
      <div className="auth-wordmark">Summerfield</div>
      <div className="auth-tagline">TEA BAR · HQ</div>
      {children}
      <blockquote className="auth-quote"><strong>Leave it better than you found it.</strong><span>The station, the storeroom, the shift notes, the mood.</span></blockquote>
      <p className="auth-footnote">Your account and department access are managed by Summerfield.</p>
    </main>
  </div>
}
