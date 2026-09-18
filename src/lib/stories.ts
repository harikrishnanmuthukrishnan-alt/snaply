import type { Story } from '../types'

export interface GroupedStory {
  userId: string
  username: string
  avatar: string | null
  stories: Story[]
}

export function groupStories(stories: Story[]): GroupedStory[] {
  const map = new Map<string, GroupedStory>()
  for (const story of stories) {
    const existing = map.get(story.user_id)
    if (existing) existing.stories.push(story)
    else {
      map.set(story.user_id, {
        userId: story.user_id,
        username: story.profiles?.username ?? 'user',
        avatar: story.profiles?.avatar_url ?? null,
        stories: [story],
      })
    }
  }
  return [...map.values()]
}
