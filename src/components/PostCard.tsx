import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import type { EnrichedPost } from '../types'
import { Avatar } from './Avatar'
import { formatCount, postShareUrl, timeAgo } from '../lib/utils'
import { toggleLike, toggleSave } from '../services/posts'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { CommentList } from './CommentList'

export function PostCard({
  post,
  onChange,
  onOpen,
}: {
  post: EnrichedPost
  onChange: (next: EnrichedPost) => void
  onOpen?: (post: EnrichedPost) => void
}) {
  const { user } = useAuth()
  const { push } = useToast()
  const [showComments, setShowComments] = useState(false)
  const author = post.profiles

  async function like() {
    if (!user) return
    const prev = post.liked
    onChange({ ...post, liked: !prev, like_count: post.like_count + (prev ? -1 : 1) })
    try {
      await toggleLike(user.id, post.id, prev)
    } catch {
      onChange(post)
      push('Could not update like.', 'error')
    }
  }

  async function save() {
    if (!user) return
    const prev = post.saved
    onChange({ ...post, saved: !prev })
    try {
      await toggleSave(user.id, post.id, prev)
    } catch {
      onChange(post)
      push('Could not save post.', 'error')
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(postShareUrl(post.id))
      push('Link copied.', 'success')
    } catch {
      push('Could not copy link.', 'error')
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to={`/profile/${author?.username ?? ''}`}>
          <Avatar url={author?.avatar_url} name={author?.username} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${author?.username ?? ''}`} className="block truncate font-semibold hover:underline">
            {author?.username ?? 'unknown'}
          </Link>
          <p className="text-xs text-zinc-400">{timeAgo(post.created_at)}</p>
        </div>
      </header>
      <button type="button" className="block w-full bg-black" onClick={() => onOpen?.(post)}>
        {post.media_type === 'video' ? (
          <video src={post.media_url} controls playsInline className="max-h-[720px] w-full bg-black object-contain" />
        ) : (
          <img src={post.media_url} alt={post.caption} className="max-h-[720px] w-full object-contain" />
        )}
      </button>
      <div className="px-4 py-3">
        <div className="flex items-center gap-1">
          <IconAction label={post.liked ? 'Unlike' : 'Like'} onClick={() => void like()}>
            <Heart className={`h-6 w-6 ${post.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </IconAction>
          <IconAction
            label="Comment"
            onClick={() => {
              setShowComments((s) => !s)
              onOpen?.(post)
            }}
          >
            <MessageCircle className="h-6 w-6" />
          </IconAction>
          <IconAction label="Share" onClick={() => void share()}>
            <Send className="h-6 w-6" />
          </IconAction>
          <IconAction label={post.saved ? 'Unsave' : 'Save'} onClick={() => void save()} className="ml-auto">
            <Bookmark className={`h-6 w-6 ${post.saved ? 'fill-current' : ''}`} />
          </IconAction>
        </div>
        <p className="mt-2 text-sm font-semibold">{formatCount(post.like_count)} likes</p>
        {post.caption && (
          <p className="mt-1 text-sm">
            <Link to={`/profile/${author?.username ?? ''}`} className="font-semibold">
              {author?.username}
            </Link>{' '}
            {post.caption}
          </p>
        )}
        <button
          type="button"
          className="mt-1 text-sm text-zinc-500 hover:underline"
          onClick={() => setShowComments((s) => !s)}
        >
          {post.comment_count > 0 ? `View all ${post.comment_count} comments` : 'Add a comment'}
        </button>
      </div>
      {showComments && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <CommentList
            postId={post.id}
            onCountChange={(delta) => onChange({ ...post, comment_count: Math.max(0, post.comment_count + delta) })}
          />
        </div>
      )}
    </article>
  )
}

function IconAction({
  label,
  onClick,
  children,
  className = '',
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-full p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
    >
      {children}
    </button>
  )
}
