import { ArrowRight } from 'lucide-react'
import { Notice } from '@/shared/ui/Notice'
import { AuthFrame } from '../components/AuthFrame'

export function AccessErrorPage({ error, onSignOut, onPreview }: { error: string; onSignOut: () => void; onPreview?: () => void }) {
  return <AuthFrame><div className="auth-access-state"><h1>We couldn't open your workspace</h1><Notice>{error}</Notice><button className="button button-dark" type="button" onClick={onSignOut}>Sign out</button>{onPreview && <button className="auth-preview-button" type="button" onClick={onPreview}>Preview the HQ design <ArrowRight size={15} /></button>}</div></AuthFrame>
}
