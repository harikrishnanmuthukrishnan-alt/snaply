import { supabase } from '../lib/supabase'
import type { AppNotification } from '../types'

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:actor_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as unknown as AppNotification[]
}

export async function unreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  let query = supabase.from('notifications').update({ read: true }).eq('user_id', userId)
  if (ids?.length) query = query.in('id', ids)
  const { error } = await query
  if (error) throw error
}
