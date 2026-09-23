import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { isConfigured } from '@/shared/api/supabase'
import { errorText } from '@/shared/lib/format'
import { Notice } from '@/shared/ui/Notice'
import { AuthFrame } from '../components/AuthFrame'

export function SignInPage({ onSignIn, onPreview, sessionError }: { onSignIn: (account: string, password: string) => Promise<void>; onPreview: () => void; sessionError: string }) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try { await onSignIn(account.trim().toLowerCase(), password) }
    catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  return <AuthFrame>
      <div className="auth-heading"><h1>Welcome back</h1><p>Sign in with your Summerfield account.</p></div>
      {!isConfigured && <Notice>HQ needs its Supabase URL and publishable key before sign-in is available.</Notice>}
      {(error || sessionError) && <Notice>{error || sessionError}</Notice>}
      <form onSubmit={submit} className="auth-form">
        <label>Account<input autoComplete="username" autoCapitalize="none" spellCheck={false} value={account} onChange={(event) => setAccount(event.target.value)} required placeholder="Your account" /></label>
        <label>Password<span className="auth-password"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        <button className="button button-dark" disabled={busy || !isConfigured} type="submit">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
      {import.meta.env.DEV && <button className="auth-preview-button" type="button" onClick={onPreview}>Preview the HQ design <ArrowRight size={15} /></button>}
  </AuthFrame>
}
