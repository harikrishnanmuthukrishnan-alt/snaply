import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { groupStories } from '../lib/stories'
import { Avatar } from './Avatar'
import { ConfirmDialog } from './ConfirmDialog'
import type { Story } from '../types'
import { deleteStory, recordStoryView } from '../services/stories'
import { useAuth } from '../hooks/useAuth'
import { timeAgo } from '../lib/utils'

export function StoryViewer({
  stories,
  startGroup,
  onClose,
  onDeleted,
}: {
  stories: Story[]
  startGroup: number
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const { user } = useAuth()
  const groups = useMemo(() => groupStories(stories), [stories])
  const [groupIndex, setGroupIndex] = useState(startGroup)
  const [itemIndex, setItemIndex] = useState(0)
  const [confirm, setConfirm] = useState(false)

  const group = groups[groupIndex]
  const current = group?.stories[itemIndex]

  useEffect(() => {
    if (!current || !user) return
    void recordStoryView(current.id, user.id)
  }, [current, user])

  const next = useCallback(() => {
    const active = groups[groupIndex]
    if (!active) return
    if (itemIndex < active.stories.length - 1) setItemIndex((i) => i + 1)
    else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1)
      setItemIndex(0)
    } else onClose()
  }, [groupIndex, groups, itemIndex, onClose])

  const prev = useCallback(() => {
    if (itemIndex > 0) setItemIndex((i) => i - 1)
    else if (groupIndex > 0) {
      const previous = groups[groupIndex - 1]
      setGroupIndex((g) => g - 1)
      setItemIndex(Math.max(0, (previous?.stories.length ?? 1) - 1))
    }
  }, [groupIndex, groups, itemIndex])

  useEffect(() => {
    if (!current) return
    if (current.media_type === 'video') return
    const id = window.setTimeout(() => next(), 5000)
    return () => window.clearTimeout(id)
  }, [current, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, onClose, prev])

  if (!group || !current) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
      <button type="button" aria-label="Close" className="absolute right-4 top-4 text-white" onClick={onClose}>
        <X className="h-7 w-7" />
      </button>
      <div className="relative h-[min(92vh,820px)] w-[min(92vw,420px)] overflow-hidden rounded-3xl bg-zinc-900">
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {group.stories.map((s, i) => (
            <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className={`block h-full bg-white ${i < itemIndex ? 'w-full' : i === itemIndex ? 'w-full animate-pulse' : 'w-0'}`} />
            </span>
          ))}
        </div>
        <div className="absolute left-3 top-8 z-10 flex items-center gap-2 text-white">
          <Avatar url={group.avatar} name={group.username} size="sm" />
          <div>
            <p className="text-sm font-semibold">{group.username}</p>
            <p className="text-xs text-white/70">{timeAgo(current.created_at)}</p>
          </div>
        </div>
        {user?.id === current.user_id && (
          <button
            type="button"
            aria-label="Delete story"
            className="absolute right-3 top-8 z-10 rounded-full bg-black/40 p-2 text-white"
            onClick={() => setConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {current.media_type === 'video' ? (
          <video
            src={current.media_url}
            autoPlay
            playsInline
            className="h-full w-full object-contain"
            onEnded={next}
          />
        ) : (
          <img src={current.media_url} alt="" className="h-full w-full object-contain" />
        )}
        <button type="button" aria-label="Previous" className="absolute inset-y-0 left-0 w-1/3" onClick={prev} />
        <button type="button" aria-label="Next" className="absolute inset-y-0 right-0 w-1/3" onClick={next} />
      </div>
      <button type="button" aria-label="Previous story" className="absolute left-4 hidden text-white md:block" onClick={prev}>
        <ChevronLeft className="h-10 w-10" />
      </button>
      <button type="button" aria-label="Next story" className="absolute right-4 hidden text-white md:block" onClick={next}>
        <ChevronRight className="h-10 w-10" />
      </button>
      <ConfirmDialog
        open={confirm}
        title="Delete this story?"
        message="It will disappear for everyone."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await deleteStory(current.id)
          onDeleted(current.id)
          setConfirm(false)
          next()
        }}
      />
    </div>
  )
}
