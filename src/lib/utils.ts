export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function timeAgo(iso: string) {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const seconds = Math.max(0, Math.floor((now - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString()
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function extractHashtags(caption: string) {
  const matches = caption.match(/#[a-zA-Z0-9_]+/g) ?? []
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))]
}

export function friendlyAuthError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return 'Email or password is incorrect.'
  if (lower.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (lower.includes('user already registered')) return 'An account with this email already exists.'
  if (lower.includes('password')) return 'Password does not meet the requirements.'
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many attempts. Try again shortly.'
  if (lower.includes('network') || lower.includes('fetch')) return 'Network problem. Check your connection and try again.'
  return message || 'Something went wrong. Please try again.'
}

export function fileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/quicktime') return 'mov'
  return 'bin'
}

export function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this video.'))
    }
    video.src = url
  })
}

export function postShareUrl(postId: string) {
  return `${window.location.origin}/post/${postId}`
}
