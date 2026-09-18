import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  CLIP_MAX_SECONDS,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_STORY_BYTES,
  MAX_VIDEO_BYTES,
  STORY_MAX_SECONDS,
  VIDEO_TYPES,
} from '../lib/constants'
import { extractHashtags, readVideoDuration, cn } from '../lib/utils'
import { createPost } from '../services/posts'
import { createStory } from '../services/stories'
import { uploadMedia } from '../services/storage'

type Mode = 'post' | 'clip' | 'story'

export function CreatePage() {
  const [params] = useSearchParams()
  const initial = (params.get('mode') as Mode) || 'post'
  const [mode, setMode] = useState<Mode>(initial)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const isVideo = file?.type.startsWith('video/') ?? false

  const accept = useMemo(() => {
    if (mode === 'clip') return 'video/mp4,video/webm,video/quicktime'
    return 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
  }, [mode])

  async function onFile(next: File | undefined) {
    if (!next) return
    try {
      if (mode === 'clip') {
        if (!VIDEO_TYPES.includes(next.type)) throw new Error('Clips must be MP4, WebM, or MOV videos.')
        if (next.size > MAX_VIDEO_BYTES) throw new Error('Videos must be 50MB or smaller.')
        const duration = await readVideoDuration(next)
        if (duration > CLIP_MAX_SECONDS) throw new Error('Clips can be up to 90 seconds.')
      } else if (mode === 'story') {
        const ok = IMAGE_TYPES.includes(next.type) || VIDEO_TYPES.includes(next.type)
        if (!ok) throw new Error('Stories support images or short videos.')
        if (next.size > MAX_STORY_BYTES) throw new Error('Stories must be 20MB or smaller.')
        if (VIDEO_TYPES.includes(next.type)) {
          const duration = await readVideoDuration(next)
          if (duration > STORY_MAX_SECONDS) throw new Error('Story videos can be up to 30 seconds.')
        }
      } else {
        const ok = IMAGE_TYPES.includes(next.type) || VIDEO_TYPES.includes(next.type)
        if (!ok) throw new Error('Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.')
        if (IMAGE_TYPES.includes(next.type) && next.size > MAX_IMAGE_BYTES) throw new Error('Images must be 10MB or smaller.')
        if (VIDEO_TYPES.includes(next.type) && next.size > MAX_VIDEO_BYTES) throw new Error('Videos must be 50MB or smaller.')
      }
      setFile(next)
      setPreview(URL.createObjectURL(next))
    } catch (err) {
      push(err instanceof Error ? err.message : 'This file is not supported.', 'error')
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !file) {
      push('Choose a photo or video first.', 'error')
      return
    }
    if (mode !== 'story' && !caption.trim()) {
      push('Add a caption before publishing.', 'error')
      return
    }
    setBusy(true)
    setProgress(5)
    try {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      const bucket = mode === 'story' ? 'stories' : mediaType === 'video' ? 'videos' : 'posts'
      const url = await uploadMedia({
        bucket,
        userId: user.id,
        file,
        onProgress: setProgress,
      })
      if (mode === 'story') {
        await createStory({ userId: user.id, mediaUrl: url, mediaType })
        push('Story published.', 'success')
        navigate('/home')
      } else {
        await createPost({
          userId: user.id,
          mediaUrl: url,
          mediaType,
          caption: caption.trim(),
          hashtags: extractHashtags(caption),
          isClip: mode === 'clip',
        })
        push('Published.', 'success')
        navigate(mode === 'clip' ? '/clips' : '/home')
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'Upload failed. Try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Create</h1>
      <div className="mb-6 flex gap-2 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
        {(['post', 'clip', 'story'] as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item)
              setFile(null)
              setPreview(null)
            }}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-medium capitalize',
              mode === item ? 'bg-white shadow dark:bg-zinc-800' : 'text-zinc-500',
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-800">
          {preview ? (
            isVideo ? (
              <video src={preview} controls className="max-h-80 w-full rounded-2xl object-contain" />
            ) : (
              <img src={preview} alt="Preview" className="max-h-80 rounded-2xl object-contain" />
            )
          ) : (
            <span className="text-sm text-zinc-500">Tap to select an image or video</span>
          )}
          <input type="file" accept={accept} className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </label>
        {mode !== 'story' && (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption. Add #hashtags to help people find this."
            className="min-h-28 w-full rounded-2xl border border-zinc-200 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          />
        )}
        {busy && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Uploading… {progress}%</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            Publish
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
