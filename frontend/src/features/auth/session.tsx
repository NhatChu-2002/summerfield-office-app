import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { requireSupabase, supabase } from '@/shared/api/supabase'
import { errorText } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/toast'
import { loadAccess, type Access } from './api'

type SessionState = {
  /** `undefined` while the saved session is still being checked. */
  session: Session | null | undefined
  /** The signed-in person's organization and department access, once loaded. */
  access: Access | null
  accessError: string
  signIn: (account: string, password: string) => Promise<void>
  /** Resolves to false when sign-out failed (the error is shown as a toast). */
  signOut: () => Promise<boolean>
  changeOrganization: (organizationId: string) => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [access, setAccess] = useState<Access | null>(null)
  const [accessError, setAccessError] = useState('')
  const [organizationId, setOrganizationId] = useState(() => localStorage.getItem('sfhq_organization') || '')

  useEffect(() => {
    if (!supabase) { setSession(null); return }
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) { setSession(data.session); if (error) setAccessError(error.message) }
    }).catch((cause) => { if (mounted) { setSession(null); setAccessError(errorText(cause)) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session) { setAccess(null); return }
    let active = true
    setAccessError('')
    setAccess(null)
    loadAccess(session, organizationId).then((next) => {
      if (active) {
        setAccess(next)
        localStorage.setItem('sfhq_organization', next.organization.organization_id)
      }
    }).catch((cause) => { if (active) setAccessError(errorText(cause)) })
    return () => { active = false }
  }, [session?.user.id, organizationId])

  const signIn = useCallback(async (account: string, password: string) => {
    const { error } = await requireSupabase().auth.signInWithPassword({ email: account, password })
    if (error) throw new Error(error.message)
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await requireSupabase().auth.signOut()
    if (error) { toast(error.message); return false }
    setSession(null); setAccess(null)
    return true
  }, [toast])

  const changeOrganization = useCallback((id: string) => {
    localStorage.setItem('sfhq_organization', id)
    setOrganizationId(id)
    window.location.hash = '#/'
  }, [])

  return <SessionContext.Provider value={{ session, access, accessError, signIn, signOut, changeOrganization }}>
    {children}
  </SessionContext.Provider>
}

export function useSession() {
  const state = useContext(SessionContext)
  if (!state) throw new Error('useSession must be used inside SessionProvider.')
  return state
}
