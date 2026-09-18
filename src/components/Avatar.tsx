import { User } from 'lucide-react'
import { cn } from '../lib/utils'

export function Avatar({
  url,
  name,
  size = 'md',
  ring = false,
}: {
  url?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
}) {
  const dim =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : size === 'xl' ? 'h-24 w-24' : 'h-11 w-11'
  const inner = (
    <span
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800',
        dim,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </span>
  )
  if (!ring) return inner
  return (
    <span className="story-ring rounded-full p-[2px]">
      <span className="block rounded-full bg-white p-[2px] dark:bg-zinc-950">{inner}</span>
    </span>
  )
}
