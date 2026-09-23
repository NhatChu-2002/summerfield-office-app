import { useState } from 'react'
import { useRoute } from '@/shared/lib/routing'
import { ToastProvider } from '@/shared/ui/toast'
import { AccessErrorPage, AuthStatusPage, SessionProvider, SignInPage, useSession } from '@/features/auth'
import { AppRoutes } from './AppRoutes'
import { PreviewApp } from './PreviewApp'
import { HqDataProvider } from './providers/HqDataProvider'

export default function App() {
  return <ToastProvider>
    <SessionProvider>
      <AppGate />
    </SessionProvider>
  </ToastProvider>
}

// Decides what the person can see: sign-in, access checks, design preview, or the workspace.
function AppGate() {
  const route = useRoute()
  const [preview, setPreview] = useState(false)
  const { session, access, accessError, signIn, signOut, changeOrganization } = useSession()
  const leave = async () => { if (await signOut()) setPreview(false) }

  if (session === undefined) return <AuthStatusPage message="Checking your access." />
  if (preview && (session || import.meta.env.DEV)) return <PreviewApp route={route} onExit={() => setPreview(false)} />
  if (!session) return <SignInPage onSignIn={signIn} onPreview={() => setPreview(true)} sessionError={accessError} />
  if (!access) return accessError
    ? <AccessErrorPage error={accessError} onSignOut={() => void leave()} onPreview={import.meta.env.DEV ? () => setPreview(true) : undefined} />
    : <AuthStatusPage message="Checking your department access." />

  return <HqDataProvider key={`${access.userId}:${access.organization.organization_id}`} access={access}>
    <AppRoutes route={route} access={access} onSignOut={() => void leave()} onOrganization={changeOrganization}
      onEnterPreview={import.meta.env.DEV || access.organization.role === 'admin' ? () => setPreview(true) : undefined} />
  </HqDataProvider>
}
