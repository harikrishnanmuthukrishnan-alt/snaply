import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { updateProfile } from '../services/profiles'
import { uploadMedia } from '../services/storage'
import { supabase } from '../lib/supabase'
import { IMAGE_TYPES, MAX_AVATAR_BYTES, USERNAME_PATTERN } from '../lib/constants'
import { friendlyAuthError } from '../lib/utils'

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { dark, toggle } = useTheme()
  const { push } = useToast()
  const navigate = useNavigate()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [password, setPassword] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notifyFollows, setNotifyFollows] = useState(profile?.notify_follows ?? true)
  const [notifyLikes, setNotifyLikes] = useState(profile?.notify_likes ?? true)
  const [notifyComments, setNotifyComments] = useState(profile?.notify_comments ?? true)
  const [notifyMessages, setNotifyMessages] = useState(profile?.notify_messages ?? true)

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setDisplayName(profile.display_name)
    setBio(profile.bio)
    setWebsite(profile.website)
    setNotifyFollows(profile.notify_follows)
    setNotifyLikes(profile.notify_likes)
    setNotifyComments(profile.notify_comments)
    setNotifyMessages(profile.notify_messages)
  }, [profile])

  async function saveProfile(e?: FormEvent) {
    e?.preventDefault()
    if (!user) return
    if (!USERNAME_PATTERN.test(username)) {
      push('Usernames must be 3–20 letters, numbers, or underscores.', 'error')
      return
    }
    setBusy(true)
    try {
      await updateProfile(user.id, {
        username,
        display_name: displayName,
        bio,
        website,
        notify_follows: notifyFollows,
        notify_likes: notifyLikes,
        notify_comments: notifyComments,
        notify_messages: notifyMessages,
      })
      await refreshProfile()
      push('Profile saved.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save profile.'
      push(message.includes('duplicate') || message.includes('unique') ? 'That username is taken.' : message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file || !user) return
    if (!IMAGE_TYPES.includes(file.type)) {
      push('Use a JPEG, PNG, WebP, or GIF.', 'error')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      push('Keep profile pictures under 5MB.', 'error')
      return
    }
    try {
      const url = await uploadMedia({ bucket: 'avatars', userId: user.id, file })
      await updateProfile(user.id, { avatar_url: url })
      await refreshProfile()
      push('Photo updated.', 'success')
    } catch {
      push('Could not upload photo.', 'error')
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      push('Use at least 6 characters.', 'error')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      push(friendlyAuthError(error.message), 'error')
      return
    }
    setPassword('')
    push('Password updated.', 'success')
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Profile picture</h2>
        <div className="flex items-center gap-4">
          <Avatar url={profile?.avatar_url} name={profile?.username} size="lg" />
          <label className="cursor-pointer text-sm font-medium text-brand">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onAvatar(e.target.files?.[0])} />
          </label>
        </div>
      </section>

      <form onSubmit={saveProfile} className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Edit profile</h2>
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Display name" value={displayName} onChange={setDisplayName} />
        <label className="block text-sm font-medium">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <Field label="Website" value={website} onChange={setWebsite} />
        <Button type="submit" disabled={busy}>
          Save profile
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Change password</h2>
        <label className="block text-sm font-medium">
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <Button type="submit">Update password</Button>
      </form>

      <section className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Appearance</h2>
        <label className="flex items-center justify-between text-sm">
          Dark mode
          <input type="checkbox" checked={dark} onChange={toggle} className="h-5 w-5 accent-brand" />
        </label>
      </section>

      <section className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Notification preferences</h2>
        <Toggle label="New followers" checked={notifyFollows} onChange={setNotifyFollows} />
        <Toggle label="Likes on your posts" checked={notifyLikes} onChange={setNotifyLikes} />
        <Toggle label="Comments on your posts" checked={notifyComments} onChange={setNotifyComments} />
        <Toggle label="Direct messages" checked={notifyMessages} onChange={setNotifyMessages} />
        <Button variant="secondary" onClick={() => void saveProfile()}>
          Save preferences
        </Button>
      </section>

      <Button variant="danger" onClick={() => setLogoutOpen(true)}>
        Log out
      </Button>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out of Snaply?"
        message="You can sign back in any time."
        confirmLabel="Log out"
        danger
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => void logout()}
      />
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 px-3 dark:border-zinc-700 dark:bg-zinc-800"
      />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
    </label>
  )
}
