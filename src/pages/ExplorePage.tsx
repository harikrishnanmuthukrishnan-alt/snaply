import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { fetchExplorePosts } from '../services/posts'
import { PostGrid } from '../components/PostGrid'
import { PostModal } from '../components/PostModal'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import type { EnrichedPost } from '../types'

export function ExplorePage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [posts, setPosts] = useState<EnrichedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<EnrichedPost | null>(null)

  useEffect(() => {
    if (!user) return
    fetchExplorePosts(user.id)
      .then(setPosts)
      .catch(() => push('Could not load explore.', 'error'))
      .finally(() => setLoading(false))
  }, [user, push])

  function patch(next: EnrichedPost) {
    setPosts((list) => list.map((p) => (p.id === next.id ? next : p)))
    setOpen(next)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Explore</h1>
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Compass} title="Nothing to explore yet" description="Be the first to publish a Snaply post." />
      ) : (
        <PostGrid posts={posts} onOpen={setOpen} />
      )}
      <PostModal post={open} onClose={() => setOpen(null)} onChange={patch} />
    </div>
  )
}
