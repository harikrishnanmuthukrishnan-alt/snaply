import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/utils'
import { Button } from './Button'

export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)

  async function signInWithGoogle() {
    onError('')
    if (!isSupabaseConfigured) {
      onError('Google sign-in is unavailable until Supabase is configured.')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })

    if (error) {
      setBusy(false)
      onError(friendlyAuthError(error.message))
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void signInWithGoogle()}>
      <LogIn className="h-4 w-4" />
      {busy ? 'Connecting to Google...' : 'Continue with Google'}
    </Button>
  )
}
