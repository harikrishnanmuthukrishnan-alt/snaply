import { Plus } from 'lucide-react'
import { Avatar } from './Avatar'
import type { Story } from '../types'
import { useAuth } from '../hooks/useAuth'
import { groupStories } from '../lib/stories'

export function StoryRail({
  stories,
  onOpen,
  onAdd,
}: {
  stories: Story[]
  onOpen: (index: number) => void
  onAdd: () => void
}) {
  const { user, profile } = useAuth()
  const groups = groupStories(stories)
  const mine = groups.findIndex((g) => g.userId === user?.id)

  return (
    <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
      <div className="flex w-20 shrink-0 flex-col items-center gap-1">
        <span className="relative">
          <button
            type="button"
            onClick={() => (mine >= 0 ? onOpen(mine) : onAdd())}
            aria-label="Your story"
          >
            <Avatar url={profile?.avatar_url} name={profile?.username} ring={mine >= 0} />
          </button>
          <button
            type="button"
            aria-label="Add story"
            onClick={onAdd}
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
        <span className="w-full truncate text-center text-xs">Your story</span>
      </div>
      {groups.map((group, i) =>
        group.userId === user?.id ? null : (
          <button
            key={group.userId}
            type="button"
            onClick={() => onOpen(i)}
            className="flex w-20 shrink-0 flex-col items-center gap-1"
          >
            <Avatar url={group.avatar} name={group.username} ring />
            <span className="w-full truncate text-center text-xs">{group.username}</span>
          </button>
        ),
      )}
    </div>
  )
}
