import {
  Bell,
  Clapperboard,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PlusSquare,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Avatar } from '../components/Avatar'
import { ConfigBanner } from '../components/ConfigBanner'
import { useAuth } from '../hooks/useAuth'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'

const nav = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/clips', label: 'Clips', icon: Clapperboard },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/create', label: 'Create', icon: PlusSquare },
]

export function AppLayout() {
  const { profile } = useAuth()
  const unread = useUnreadCount()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-ink dark:bg-zinc-950 dark:text-zinc-50">
      <ConfigBanner />
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-[76px] flex-col border-r border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950 md:flex lg:w-64">
        <div className="px-4 lg:px-6">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <span className="hidden lg:block">
            <Logo />
          </span>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1 px-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-900',
                  isActive && 'bg-brand/10 text-brand',
                )
              }
            >
              <item.icon className="h-6 w-6 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="absolute right-3 top-2 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold text-white lg:static lg:ml-auto">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to={profile ? `/profile/${profile.username}` : '/settings'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900',
                isActive && 'bg-brand/10 text-brand',
              )
            }
          >
            <UserRound className="h-6 w-6" />
            <span className="hidden lg:inline">Profile</span>
          </NavLink>
        </nav>
        <div className="px-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <Settings className="h-6 w-6" />
            <span className="hidden lg:inline">Settings</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <LogOut className="h-6 w-6" />
            <span className="hidden lg:inline">Log out</span>
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
        <Logo />
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Search" onClick={() => navigate('/search')} className="rounded-full p-2">
            <Search className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Messages" onClick={() => navigate('/messages')} className="rounded-full p-2">
            <MessageCircle className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Notifications" onClick={() => navigate('/notifications')} className="relative rounded-full p-2">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
          </button>
          <button type="button" aria-label="Menu" onClick={() => setMenu((m) => !m)} className="rounded-full p-2">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      {menu && (
        <div className="border-b border-zinc-200 bg-white p-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2" onClick={() => { setMenu(false); navigate('/settings') }}>
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2" onClick={() => { setMenu(false); setLogoutOpen(true) }}>
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}

      <main className="pb-24 md:ml-[76px] md:pb-8 lg:ml-64">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-zinc-200 bg-white py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <NavLink to="/home" aria-label="Home" className="p-2"><Home className="h-6 w-6" /></NavLink>
        <NavLink to="/explore" aria-label="Explore" className="p-2"><Compass className="h-6 w-6" /></NavLink>
        <NavLink to="/create" aria-label="Create" className="rounded-full bg-brand p-2 text-white"><PlusSquare className="h-6 w-6" /></NavLink>
        <NavLink to="/clips" aria-label="Clips" className="p-2"><Clapperboard className="h-6 w-6" /></NavLink>
        <NavLink to={profile ? `/profile/${profile.username}` : '/settings'} aria-label="Profile" className="p-2">
          <Avatar url={profile?.avatar_url} name={profile?.username} size="sm" />
        </NavLink>
      </nav>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out of Snaply?"
        message="You can sign back in any time."
        confirmLabel="Log out"
        danger
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => void logout()}
      />
    </div>
  )
}
