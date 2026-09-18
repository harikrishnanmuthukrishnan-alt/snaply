import { Play } from 'lucide-react'
import type { EnrichedPost } from '../types'

export function PostGrid({
  posts,
  onOpen,
}: {
  posts: EnrichedPost[]
  onOpen: (post: EnrichedPost) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onOpen(post)}
          className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
        >
          {post.media_type === 'video' ? (
            <>
              <video src={post.media_url} className="h-full w-full object-cover" muted playsInline />
              <Play className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />
            </>
          ) : (
            <img src={post.media_url} alt={post.caption} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
          )}
          <span className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/20" />
        </button>
      ))}
    </div>
  )
}
