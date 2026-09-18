import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/utils'
import { ConfigBanner } from '../components/ConfigBanner'
import { Logo } from '../components/Logo'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Use at least 6 characters.')
      return
    }
    setBusy(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-zinc-950">
      <ConfigBanner />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="mb-8 flex justify-center">
          <Logo to="/login" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <label className="block text-sm font-medium">
            New password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
