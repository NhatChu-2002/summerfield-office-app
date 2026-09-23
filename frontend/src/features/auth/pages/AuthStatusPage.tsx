import { AuthFrame } from '../components/AuthFrame'

// Shown while the saved session or the person's department access is being checked.
export function AuthStatusPage({ message }: { message: string }) {
  return <AuthFrame><div className="auth-heading" role="status"><h1>Just a moment...</h1><p>{message}</p></div></AuthFrame>
}
