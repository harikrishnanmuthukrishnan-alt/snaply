import { createClient } from '@supabase/supabase-js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
// Supabase project URLs must not include the REST endpoint. Normalize it here
// as a safety net for local and deployed environment-variable configuration.
const url = configuredUrl.replace(/\/rest\/v1\/?$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project-ref'))

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
