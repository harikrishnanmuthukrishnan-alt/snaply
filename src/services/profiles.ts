import { supabase } from '../lib/supabase'
import type { Profile, Post } from '../types'

export async function fetchProfileById(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(id: string, patch: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data as Profile
}

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase.rpc('is_username_available', { desired: username })
  if (error) throw error
  return Boolean(data)
}

export async function searchPeople(query: string) {
  const q = query.trim().replace(/[%*,()]/g, '').slice(0, 32)
  if (!q) return [] as Profile[]
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20)
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function searchHashtags(query: string) {
  const tag = query.replace(/^#/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!tag) return [] as Post[]
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .contains('hashtags', [tag])
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as Post[]
}

export async function fetchSuggestions(userId: string) {
  const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', userId)
  const exclude = [userId, ...(following ?? []).map((f) => f.following_id)]
  const { data, error } = await supabase.from('profiles').select('*').not('id', 'in', `(${exclude.join(',')})`).limit(6)
  if (error) {
    const { data: fallback } = await supabase.from('profiles').select('*').neq('id', userId).limit(6)
    return (fallback ?? []).filter((p) => !exclude.includes(p.id)) as Profile[]
  }
  return (data ?? []) as Profile[]
}

export async function profileStats(userId: string) {
  const [{ count: posts }, { count: followers }, { count: following }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  return {
    posts: posts ?? 0,
    followers: followers ?? 0,
    following: following ?? 0,
  }
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('You cannot follow yourself.')
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
  if (error) throw error
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw error
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function fetchFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id(*)')
    .eq('following_id', userId)
  if (error) throw error
  return ((data ?? []) as unknown as { profiles: Profile }[]).map((row) => row.profiles).filter(Boolean)
}

export async function fetchFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id(*)')
    .eq('follower_id', userId)
  if (error) throw error
  return ((data ?? []) as unknown as { profiles: Profile }[]).map((row) => row.profiles).filter(Boolean)
}
