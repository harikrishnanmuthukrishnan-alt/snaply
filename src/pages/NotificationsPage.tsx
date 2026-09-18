import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { fetchNotifications, markNotificationsRead } from '../services/notifications'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { timeAgo } from '../lib/utils'
import type { AppNotification } from '../types'

function noticeText(item: AppNotification) {
  const name = item.actor?.username ?? 'Someone'
  if (item.type === 'follow') return `${name} started following you`
  if (item.type === 'like') return `${name} liked your post`
  if (item.type === 'comment') return `${name} commented on your post`
  return `${name} sent you a message`
}

function noticeTo(item: AppNotification) {
  if (item.type === 'follow' && item.actor?.username) return `/profile/${item.actor.username}`
  if (item.type === 'message' && item.conversation_id) return '/messages'
  if (item.post_id) return `/post/${item.post_id}`
  return '/notifications'
}

export function NotificationsPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id)
      .then(setItems)
      .catch(() => push('Could not load notifications.', 'error'))
      .finally(() => setLoading(false))
  }, [user, push])

  async function markAll() {
    if (!user) return
    await markNotificationsRead(user.id)
    setItems((list) => list.map((n) => ({ ...n, read: true })))
  }

  async function open(item: AppNotification) {
    if (!user) return
    if (!item.read) {
      await markNotificationsRead(user.id, [item.id])
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    }
    navigate(noticeTo(item))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button variant="secondary" size="sm" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      {!loading && items.length === 0 && (
        <EmptyState icon={Bell} title="You are all caught up" description="Likes, comments, follows, and messages will show up here." />
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void open(item)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white dark:hover:bg-zinc-900 ${
              item.read ? '' : 'bg-brand/5'
            }`}
          >
            <Link to={`/profile/${item.actor?.username ?? ''}`} onClick={(e) => e.stopPropagation()}>
              <Avatar url={item.actor?.avatar_url} name={item.actor?.username} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{noticeText(item)}</p>
              <p className="text-xs text-zinc-400">{timeAgo(item.created_at)}</p>
            </div>
            {!item.read && <span className="h-2 w-2 rounded-full bg-brand" />}
          </button>
        ))}
      </div>
    </div>
  )
}
