import { supabase } from '../lib/supabase'
import type { EnrichedPost, Post } from '../types'

async function enrichPosts(posts: Post[], userId: string | undefined): Promise<EnrichedPost[]> {
  if (posts.length === 0) return []
  const ids = posts.map((p) => p.id)

  const [{ data: likes }, { data: comments }, { data: saves }, { data: myLikes }] = await Promise.all([
    supabase.from('likes').select('post_id').in('post_id', ids),
    supabase.from('comments').select('post_id').in('post_id', ids),
    userId
      ? supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    userId
      ? supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  const likeCount = new Map<string, number>()
  const commentCount = new Map<string, number>()
  for (const row of likes ?? []) {
    likeCount.set(row.post_id, (likeCount.get(row.post_id) ?? 0) + 1)
  }
  for (const row of comments ?? []) {
    commentCount.set(row.post_id, (commentCount.get(row.post_id) ?? 0) + 1)
  }
  const likedSet = new Set((myLikes ?? []).map((r) => r.post_id))
  const savedSet = new Set((saves ?? []).map((r) => r.post_id))

  return posts.map((post) => ({
    ...post,
    like_count: likeCount.get(post.id) ?? 0,
    comment_count: commentCount.get(post.id) ?? 0,
    liked: likedSet.has(post.id),
    saved: savedSet.has(post.id),
  }))
}

export async function fetchHomeFeed(userId: string) {
  const { data: follows, error: followError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (followError) throw followError

  const authorIds = [userId, ...(follows ?? []).map((f) => f.following_id)]

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .in('user_id', authorIds)
    .eq('is_clip', false)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error

  return enrichPosts((data ?? []) as Post[], userId)
}

export async function fetchExplorePosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('is_clip', false)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  return enrichPosts((data ?? []) as Post[], userId)
}

export async function fetchClips(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('is_clip', true)
    .eq('media_type', 'video')
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return enrichPosts((data ?? []) as Post[], userId)
}

export async function fetchUserPosts(userId: string, viewerId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('user_id', userId)
    .eq('is_clip', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrichPosts((data ?? []) as Post[], viewerId)
}

export async function fetchPostById(postId: string, viewerId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('id', postId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const [enriched] = await enrichPosts([data as Post], viewerId)
  return enriched ?? null
}

export async function createPost(input: {
  userId: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  hashtags: string[]
  isClip: boolean
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      media_url: input.mediaUrl,
      media_type: input.mediaType,
      caption: input.caption,
      hashtags: input.hashtags,
      is_clip: input.isClip,
    })
    .select('*, profiles(*)')
    .single()
  if (error) throw error
  return data as Post
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function toggleLike(userId: string, postId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
    if (error) throw error
    return false
  }
  const { error } = await supabase.from('likes').insert({ user_id: userId, post_id: postId })
  if (error) throw error
  return true
}

export async function toggleSave(userId: string, postId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId)
    if (error) throw error
    return false
  }
  const { error } = await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId })
  if (error) throw error
  return true
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addComment(userId: string, postId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, post_id: postId, content })
    .select('*, profiles(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}
