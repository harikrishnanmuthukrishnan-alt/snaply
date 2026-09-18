import { Bookmark, Heart, MessageCircle, Send, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import { CommentList } from './CommentList'
import { formatCount, postShareUrl, timeAgo } from '../lib/utils'
import { toggleLike, toggleSave } from '../services/posts'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { EnrichedPost } from '../types'

export function PostModal({
  post,
  onClose,
  onChange,
}: {
  post: EnrichedPost | null
  onClose: () => void
  onChange: (next: EnrichedPost) => void
}) {
  const { user } = useAuth()
  const { push } = useToast()
  if (!post) return null
  const current = post
  const author = current.profiles

  async function like() {
    if (!user) return
    const prev = current.liked
    onChange({ ...current, liked: !prev, like_count: current.like_count + (prev ? -1 : 1) })
    try {
      await toggleLike(user.id, current.id, prev)
    } catch {
      push('Could not update like.', 'error')
    }
  }

  async function save() {
    if (!user) return
    const prev = current.saved
    onChange({ ...current, saved: !prev })
    try {
      await toggleSave(user.id, current.id, prev)
    } catch {
      push('Could not save post.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <button type="button" aria-label="Close" className="absolute right-4 top-4 text-white" onClick={onClose}>
        <X className="h-7 w-7" />
      </button>
      <div
        className="flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden flex-1 bg-black sm:block">
          {current.media_type === 'video' ? (
            <video src={current.media_url} controls autoPlay playsInline className="h-full max-h-[92vh] w-full object-contain" />
          ) : (
            <img src={current.media_url} alt={current.caption} className="h-full max-h-[92vh] w-full object-contain" />
          )}
        </div>
        <div className="flex w-full max-w-md flex-col sm:w-[380px]">
          <div className="flex items-center gap-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
            <Link to={`/profile/${author?.username ?? ''}`} onClick={onClose}>
              <Avatar url={author?.avatar_url} name={author?.username} />
            </Link>
            <div>
              <Link to={`/profile/${author?.username ?? ''}`} className="font-semibold" onClick={onClose}>
                {author?.username}
              </Link>
              <p className="text-xs text-zinc-400">{timeAgo(current.created_at)}</p>
            </div>
          </div>
          <div className="block bg-black sm:hidden">
            {current.media_type === 'video' ? (
              <video src={current.media_url} controls playsInline className="max-h-80 w-full object-contain" />
            ) : (
              <img src={current.media_url} alt={current.caption} className="max-h-80 w-full object-contain" />
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {current.caption && (
              <p className="mb-4 text-sm">
                <span className="font-semibold">{author?.username}</span> {current.caption}
              </p>
            )}
            <CommentList
              postId={current.id}
              onCountChange={(delta) => onChange({ ...current, comment_count: Math.max(0, current.comment_count + delta) })}
            />
          </div>
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Like" onClick={() => void like()}>
                <Heart className={`h-6 w-6 ${current.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <MessageCircle className="h-6 w-6" />
              <button
                type="button"
                aria-label="Share"
                onClick={async () => {
                  await navigator.clipboard.writeText(postShareUrl(current.id))
                  push('Link copied.', 'success')
                }}
              >
                <Send className="h-6 w-6" />
              </button>
              <button type="button" aria-label="Save" className="ml-auto" onClick={() => void save()}>
                <Bookmark className={`h-6 w-6 ${current.saved ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="mt-2 text-sm font-semibold">{formatCount(current.like_count)} likes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
