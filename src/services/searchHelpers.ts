import type { EnrichedPost, Post } from '../types'
import { supabase } from '../lib/supabase'

export async function enrichFromRaw(posts: Post[], userId: string): Promise<EnrichedPost[]> {
  if (!posts.length) return []
  const ids = posts.map((p) => p.id)
  const [{ data: likes }, { data: comments }, { data: saves }, { data: myLikes }] = await Promise.all([
    supabase.from('likes').select('post_id').in('post_id', ids),
    supabase.from('comments').select('post_id').in('post_id', ids),
    supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', ids),
    supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', ids),
  ])
  const likeCount = new Map<string, number>()
  const commentCount = new Map<string, number>()
  for (const row of likes ?? []) likeCount.set(row.post_id, (likeCount.get(row.post_id) ?? 0) + 1)
  for (const row of comments ?? []) commentCount.set(row.post_id, (commentCount.get(row.post_id) ?? 0) + 1)
  const liked = new Set((myLikes ?? []).map((r) => r.post_id))
  const saved = new Set((saves ?? []).map((r) => r.post_id))
  return posts.map((post) => ({
    ...post,
    like_count: likeCount.get(post.id) ?? 0,
    comment_count: commentCount.get(post.id) ?? 0,
    liked: liked.has(post.id),
    saved: saved.has(post.id),
  }))
}
