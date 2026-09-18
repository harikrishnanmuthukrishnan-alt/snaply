import { Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ConfigBanner } from '../components/ConfigBanner'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dfe0ff,transparent_40%),radial-gradient(circle_at_bottom_right,#ffe7bc,transparent_35%),#f6f7fb] dark:bg-zinc-950">
      <ConfigBanner />
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Logo to="/login" />
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-brand/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">Photos, clips, and stories — with your own spark.</p>
      </div>
    </div>
  )
}
