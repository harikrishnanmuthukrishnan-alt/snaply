import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { fetchPostById } from '../services/posts'
import { PostCard } from '../components/PostCard'
import { EmptyState } from '../components/EmptyState'
import { FeedSkeleton } from '../components/Skeleton'
import type { EnrichedPost } from '../types'

export function PostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { push } = useToast()
  const [post, setPost] = useState<EnrichedPost | null>(null)
  const [missing, setMissing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user) return
    setLoading(true)
    fetchPostById(id, user.id)
      .then((row) => {
        setPost(row)
        setMissing(!row)
      })
      .catch(() => {
        setMissing(true)
        push('Could not load this post.', 'error')
      })
      .finally(() => setLoading(false))
  }, [id, user, push])

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {loading && <FeedSkeleton />}
      {!loading && missing && (
        <EmptyState icon={ImageOff} title="Post not found" description="It may have been deleted, or the link is invalid." />
      )}
      {post && <PostCard post={post} onChange={setPost} />}
    </div>
  )
}
