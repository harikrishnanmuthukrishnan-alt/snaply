import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { USERNAME_PATTERN, IMAGE_TYPES, MAX_AVATAR_BYTES } from '../lib/constants'
import { friendlyAuthError } from '../lib/utils'
import { isUsernameAvailable } from '../services/profiles'
import { uploadMedia } from '../services/storage'

export function SignupPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  function onFile(f: File | undefined) {
    if (!f) return
    if (!IMAGE_TYPES.includes(f.type)) {
      setError('Please choose a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (f.size > MAX_AVATAR_BYTES) {
      setError('Profile pictures must be 5MB or smaller.')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isSupabaseConfigured) {
      setError('Sign-up is unavailable until Supabase is configured. Add your project URL and anon key to .env.local, then restart the dev server.')
      return
    }
    if (!USERNAME_PATTERN.test(username)) {
      setError('Usernames must be 3–20 characters: letters, numbers, and underscores.')
      return
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      const available = await isUsernameAvailable(username)
      if (!available) {
        setError('That username is already taken.')
        setBusy(false)
        return
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: displayName || username } },
      })
      if (authError) throw authError
      const userId = data.user?.id
      if (userId && file) {
        const url = await uploadMedia({ bucket: 'avatars', userId, file })
        await supabase.from('profiles').update({ avatar_url: url, display_name: displayName || username }).eq('id', userId)
      }
      if (data.session) navigate('/home')
      else setInfo('Check your email to confirm your account, then log in.')
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : 'Sign up failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Join Snaply</h1>
      <p className="text-sm text-zinc-500">Create a profile and start sharing.</p>
      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {info && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
      <div className="flex items-center gap-3">
        <Avatar url={preview} name={username} size="lg" />
        <label className="cursor-pointer text-sm font-medium text-brand">
          Profile picture (optional)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Username
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <label className="block text-sm font-medium">
        Display name
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
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
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Creating account...' : 'Sign up'}
      </Button>
      <div className="flex items-center gap-3 py-1 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        or
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <GoogleSignInButton onError={setError} />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </form>
  )
}
