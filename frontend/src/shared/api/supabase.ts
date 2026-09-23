import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isConfigured = Boolean(url && key)

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null

export function requireSupabase() {
  if (!supabase) throw new Error('HQ is not connected to Supabase yet.')
  return supabase
}

export function dataOrThrow<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  if (data === null) throw new Error('The server returned no data.')
  return data
}
