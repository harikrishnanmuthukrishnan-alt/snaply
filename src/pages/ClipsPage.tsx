import { useEffect, useRef, useState } from 'react'
import { Bookmark, Clapperboard, Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { fetchClips, toggleLike, toggleSave } from '../services/posts'
import { Avatar } from '../components/Avatar'
import { EmptyState } from '../components/EmptyState'
import { PostModal } from '../components/PostModal'
import { postShareUrl } from '../lib/utils'
import type { EnrichedPost } from '../types'

export function ClipsPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [clips, setClips] = useState<EnrichedPost[]>([])
  const [open, setOpen] = useState<EnrichedPost | null>(null)
  const [muted, setMuted] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchClips(user.id)
      .then(setClips)
      .catch(() => push('Could not load clips.', 'error'))
      .finally(() => setLoading(false))
  }, [user, push])

  function patch(next: EnrichedPost) {
    setClips((list) => list.map((p) => (p.id === next.id ? next : p)))
    if (open?.id === next.id) setOpen(next)
  }

  if (!loading && clips.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState icon={Clapperboard} title="No clips yet" description="Upload a short video from Create to appear here." />
      </div>
    )
  }

  return (
    <div className="mx-auto h-[calc(100dvh-7rem)] max-w-md snap-y snap-mandatory overflow-y-scroll md:h-[calc(100dvh-2rem)]">
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          muted={muted}
          onMute={() => setMuted((m) => !m)}
          onChange={patch}
          onComment={() => setOpen(clip)}
        />
      ))}
      <PostModal post={open} onClose={() => setOpen(null)} onChange={patch} />
    </div>
  )
}

function ClipCard({
  clip,
  muted,
  onMute,
  onChange,
  onComment,
}: {
  clip: EnrichedPost
  muted: boolean
  onMute: () => void
  onChange: (next: EnrichedPost) => void
  onComment: () => void
}) {
  const { user } = useAuth()
  const { push } = useToast()
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) void el.play().catch(() => undefined)
          else el.pause()
        })
      },
      { threshold: 0.7 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  async function like() {
    if (!user) return
    const prev = clip.liked
    onChange({ ...clip, liked: !prev, like_count: clip.like_count + (prev ? -1 : 1) })
    try {
      await toggleLike(user.id, clip.id, prev)
    } catch {
      push('Could not like this clip.', 'error')
    }
  }

  async function save() {
    if (!user) return
    const prev = clip.saved
    onChange({ ...clip, saved: !prev })
    try {
      await toggleSave(user.id, clip.id, prev)
    } catch {
      push('Could not save this clip.', 'error')
    }
  }

  return (
    <section className="relative flex h-full snap-start items-center justify-center bg-black">
      <video ref={ref} src={clip.media_url} loop playsInline muted={muted} className="h-full w-full object-contain" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <Link to={`/profile/${clip.profiles?.username ?? ''}`} className="mb-2 flex items-center gap-2 font-semibold">
          <Avatar url={clip.profiles?.avatar_url} name={clip.profiles?.username} size="sm" />
          {clip.profiles?.username}
        </Link>
        <p className="text-sm">{clip.caption}</p>
      </div>
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-white">
        <button type="button" aria-label="Like" onClick={() => void like()} className="flex flex-col items-center">
          <Heart className={`h-8 w-8 ${clip.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="text-xs">{clip.like_count}</span>
        </button>
        <button type="button" aria-label="Comment" onClick={onComment} className="flex flex-col items-center">
          <MessageCircle className="h-8 w-8" />
          <span className="text-xs">{clip.comment_count}</span>
        </button>
        <button
          type="button"
          aria-label="Share"
          onClick={async () => {
            await navigator.clipboard.writeText(postShareUrl(clip.id))
            push('Link copied.', 'success')
          }}
        >
          <Send className="h-8 w-8" />
        </button>
        <button type="button" aria-label="Save" onClick={() => void save()}>
          <Bookmark className={`h-8 w-8 ${clip.saved ? 'fill-current' : ''}`} />
        </button>
        <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={onMute}>
          {muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
        </button>
      </div>
    </section>
  )
}
