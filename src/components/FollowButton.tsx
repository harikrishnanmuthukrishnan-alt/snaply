import { useState } from 'react'
import { Button } from './Button'
import { followUser, unfollowUser } from '../services/profiles'
import { useToast } from '../hooks/useToast'

export function FollowButton({
  me,
  targetId,
  initial,
  onChange,
}: {
  me: string
  targetId: string
  initial: boolean
  onChange?: (following: boolean) => void
}) {
  const { push } = useToast()
  const [following, setFollowing] = useState(initial)
  const [busy, setBusy] = useState(false)

  if (me === targetId) return null

  async function toggle() {
    setBusy(true)
    try {
      if (following) await unfollowUser(me, targetId)
      else await followUser(me, targetId)
      setFollowing(!following)
      onChange?.(!following)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not update follow.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={following ? 'secondary' : 'primary'} onClick={() => void toggle()} disabled={busy}>
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
