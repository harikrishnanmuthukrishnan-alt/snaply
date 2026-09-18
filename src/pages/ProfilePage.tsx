import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Globe, Grid3x3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  fetchFollowers,
  fetchFollowing,
  fetchProfileByUsername,
  isFollowing,
  profileStats,
} from '../services/profiles'
import { fetchUserPosts } from '../services/posts'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { FollowButton } from '../components/FollowButton'
import { PostGrid } from '../components/PostGrid'
import { PostModal } from '../components/PostModal'
import { UserListModal } from '../components/UserListModal'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { formatCount } from '../lib/utils'
import type { EnrichedPost, Profile } from '../types'

export function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [following, setFollowing] = useState(false)
  const [posts, setPosts] = useState<EnrichedPost[]>([])
  const [open, setOpen] = useState<EnrichedPost | null>(null)
  const [list, setList] = useState<'followers' | 'following' | null>(null)
  const [listUsers, setListUsers] = useState<Profile[]>([])
  const [missing, setMissing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username || !user) return
    setLoading(true)
    setMissing(false)
    fetchProfileByUsername(username)
      .then(async (p) => {
        if (!p) {
          setMissing(true)
          setProfile(null)
          return
        }
        setProfile(p)
        const [s, postsRows, followState] = await Promise.all([
          profileStats(p.id),
          fetchUserPosts(p.id, user.id),
          user.id === p.id ? Promise.resolve(false) : isFollowing(user.id, p.id),
        ])
        setStats(s)
        setPosts(postsRows)
        setFollowing(followState)
      })
      .catch(() => push('Could not load this profile.', 'error'))
      .finally(() => setLoading(false))
  }, [username, user, push])

  async function openList(kind: 'followers' | 'following') {
    if (!profile) return
    const rows = kind === 'followers' ? await fetchFollowers(profile.id) : await fetchFollowing(profile.id)
    setListUsers(rows)
    setList(kind)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-6 w-40" />
      </div>
    )
  }

  if (missing || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState icon={Grid3x3} title="Profile not found" description="That username does not exist on Snaply." />
      </div>
    )
  }

  const own = user?.id === profile.id

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar url={profile.avatar_url} name={profile.username} size="xl" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <h1 className="text-2xl font-semibold">{profile.username}</h1>
            {own ? (
              <Button variant="secondary" onClick={() => navigate('/settings')}>
                Edit profile
              </Button>
            ) : (
              user && (
                <FollowButton
                  me={user.id}
                  targetId={profile.id}
                  initial={following}
                  onChange={(next) => {
                    setFollowing(next)
                    setStats((s) => ({ ...s, followers: s.followers + (next ? 1 : -1) }))
                  }}
                />
              )
            )}
          </div>
          <p className="mt-1 text-zinc-500">{profile.display_name}</p>
          <div className="mt-4 flex justify-center gap-6 text-sm sm:justify-start">
            <span>
              <strong>{formatCount(stats.posts)}</strong> posts
            </span>
            <button type="button" onClick={() => void openList('followers')}>
              <strong>{formatCount(stats.followers)}</strong> followers
            </button>
            <button type="button" onClick={() => void openList('following')}>
              <strong>{formatCount(stats.following)}</strong> following
            </button>
          </div>
          {profile.bio && <p className="mt-3 max-w-lg text-sm">{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-brand">
              <Globe className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {!own && user && (
            <div className="mt-4">
              <Link to={`/messages?user=${profile.username}`} className="text-sm font-medium text-brand">
                Message
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="mt-10">
        {posts.length === 0 ? (
          <EmptyState icon={Grid3x3} title="No posts yet" description={own ? 'Share your first Snaply post.' : 'This profile has no posts.'} />
        ) : (
          <PostGrid posts={posts} onOpen={setOpen} />
        )}
      </div>
      <PostModal
        post={open}
        onClose={() => setOpen(null)}
        onChange={(next) => {
          setPosts((list) => list.map((p) => (p.id === next.id ? next : p)))
          setOpen(next)
        }}
      />
      <UserListModal
        open={list !== null}
        title={list === 'followers' ? 'Followers' : 'Following'}
        users={listUsers}
        onClose={() => setList(null)}
      />
    </div>
  )
}
