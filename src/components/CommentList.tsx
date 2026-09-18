import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { addComment, deleteComment, fetchComments } from '../services/posts'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { timeAgo } from '../lib/utils'
import { Avatar } from './Avatar'
import { Button } from './Button'
import type { Comment } from '../types'
import { ConfirmDialog } from './ConfirmDialog'

export function CommentList({
  postId,
  onCountChange,
}: {
  postId: string
  onCountChange?: (delta: number) => void
}) {
  const { user, profile } = useAuth()
  const { push } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    fetchComments(postId)
      .then((rows) => setComments(rows as Comment[]))
      .catch(() => push('Could not load comments.', 'error'))
  }, [postId, push])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !text.trim()) return
    try {
      const row = (await addComment(user.id, postId, text.trim())) as Comment
      setComments((c) => [...c, row])
      setText('')
      onCountChange?.(1)
    } catch {
      push('Could not post comment.', 'error')
    }
  }

  async function remove(id: string) {
    try {
      await deleteComment(id)
      setComments((c) => c.filter((row) => row.id !== id))
      onCountChange?.(-1)
      setPending(null)
    } catch {
      push('Could not delete comment.', 'error')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 && <p className="text-sm text-zinc-500">No comments yet. Start the conversation.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar url={comment.profiles?.avatar_url} name={comment.profiles?.username} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{comment.profiles?.username ?? 'user'}</span>{' '}
                <span className="text-zinc-700 dark:text-zinc-300">{comment.content}</span>
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                <span>{timeAgo(comment.created_at)}</span>
                {user?.id === comment.user_id && (
                  <button type="button" className="hover:text-rose-500" onClick={() => setPending(comment.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Avatar url={profile?.avatar_url} name={profile?.username} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="h-10 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-800"
        />
        <Button type="submit" size="sm" disabled={!text.trim()}>
          Post
        </Button>
      </form>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete comment?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onClose={() => setPending(null)}
        onConfirm={() => pending && void remove(pending)}
      />
    </div>
  )
}
