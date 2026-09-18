import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Images } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { PostModal } from '../components/PostModal'
import { FeedSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { StoryRail } from '../components/StoryRail'
import { StoryViewer } from '../components/StoryViewer'
import { Avatar } from '../components/Avatar'
import { FollowButton } from '../components/FollowButton'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { fetchHomeFeed } from '../services/posts'
import { fetchActiveStories } from '../services/stories'
import { fetchSuggestions } from '../services/profiles'
import type { EnrichedPost, Profile, Story } from '../types'

export function HomePage() {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<EnrichedPost[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<EnrichedPost | null>(null)
  const [storyGroup, setStoryGroup] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([fetchHomeFeed(user.id), fetchActiveStories(), fetchSuggestions(user.id)])
      .then(([feed, storyRows, people]) => {
        setPosts(feed)
        setStories(storyRows)
        setSuggestions(people)
      })
      .catch(() => push('Could not load your feed. Check your connection.', 'error'))
      .finally(() => setLoading(false))
  }, [user, push])

  function patch(next: EnrichedPost) {
    setPosts((list) => list.map((p) => (p.id === next.id ? next : p)))
    if (open?.id === next.id) setOpen(next)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[minmax(0,640px)_280px] lg:justify-center">
      <div>
        <StoryRail
          stories={stories}
          onAdd={() => navigate('/create?mode=story')}
          onOpen={(i) => setStoryGroup(i)}
        />
        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Images}
            title="Your feed is quiet"
            description="Follow people or explore Snaply to see photos and videos here."
            action={{ label: 'Explore', onClick: () => navigate('/explore') }}
          />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onChange={patch} onOpen={setOpen} />
            ))}
          </div>
        )}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-3xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">People to follow</h2>
          <div className="space-y-3">
            {suggestions.length === 0 && <p className="text-sm text-zinc-500">No suggestions right now.</p>}
            {suggestions.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                <Link to={`/profile/${person.username}`}>
                  <Avatar url={person.avatar_url} name={person.username} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${person.username}`} className="block truncate text-sm font-semibold">
                    {person.username}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">{person.display_name}</p>
                </div>
                {user && <FollowButton me={user.id} targetId={person.id} initial={false} />}
              </div>
            ))}
          </div>
        </div>
      </aside>
      <PostModal post={open} onClose={() => setOpen(null)} onChange={patch} />
      {storyGroup !== null && (
        <StoryViewer
          stories={stories}
          startGroup={storyGroup}
          onClose={() => setStoryGroup(null)}
          onDeleted={(id) => setStories((list) => list.filter((s) => s.id !== id))}
        />
      )}
    </div>
  )
}
