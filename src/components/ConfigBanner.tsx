import { isSupabaseConfigured } from '../lib/supabase'

export function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Supabase is not configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and add your project URL
      and anon key.
    </div>
  )
}
