import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }
    navigate('/home')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="text-sm text-zinc-500">Log in to see what your circle posted today.</p>
      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
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
      <label className="block text-sm font-medium">
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <div className="text-right">
        <Link to="/forgot-password" className="text-sm text-brand hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Signing in...' : 'Log in'}
      </Button>
      <div className="flex items-center gap-3 py-1 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        or
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <GoogleSignInButton onError={setError} />
      <p className="text-center text-sm text-zinc-500">
        New to Snaply?{' '}
        <Link to="/signup" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </form>
  )
}
