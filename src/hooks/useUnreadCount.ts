import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { unreadNotificationCount } from '../services/notifications'
import { useAuth } from './useAuth'

export function useUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }
    let active = true
    unreadNotificationCount(user.id)
      .then((n) => {
        if (active) setCount(n)
      })
      .catch(() => undefined)

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          unreadNotificationCount(user.id)
            .then((n) => {
              if (active) setCount(n)
            })
            .catch(() => undefined)
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user])

  return count
}
