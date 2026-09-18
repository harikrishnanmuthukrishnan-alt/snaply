import { Camera, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export function Logo({ compact = false, to = '/home' }: { compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/30">
        <Camera className="h-5 w-5" strokeWidth={2.2} />
        <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 text-spark" fill="currentColor" />
      </span>
      {!compact && (
        <span className={cn('text-xl font-semibold tracking-tight text-ink dark:text-white')}>Snaply</span>
      )}
    </Link>
  )
}
