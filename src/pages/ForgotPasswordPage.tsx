import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/utils'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const redirectTo = `${window.location.origin}/reset-password`
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setBusy(false)
    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }
    setInfo('If that email is registered, you will receive a reset link shortly.')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-zinc-500">We will send a reset link to your email.</p>
      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {info && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Sending...' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm">
        <Link to="/login" className="text-brand">
          Back to login
        </Link>
      </p>
    </form>
  )
}
