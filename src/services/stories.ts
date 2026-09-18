import { supabase } from '../lib/supabase'
import type { Story } from '../types'

export async function fetchActiveStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*, profiles(*)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Story[]
}

export async function createStory(input: {
  userId: string
  mediaUrl: string
  mediaType: 'image' | 'video'
}) {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: input.userId,
      media_url: input.mediaUrl,
      media_type: input.mediaType,
    })
    .select('*, profiles(*)')
    .single()
  if (error) throw error
  return data as Story
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase.from('stories').delete().eq('id', storyId)
  if (error) throw error
}

export async function recordStoryView(storyId: string, viewerId: string) {
  await supabase.from('story_views').upsert({ story_id: storyId, viewer_id: viewerId })
}
