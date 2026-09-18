export type MediaType = 'image' | 'video'
export type NotificationType = 'follow' | 'like' | 'comment' | 'message'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  website: string
  avatar_url: string | null
  notify_follows: boolean
  notify_likes: boolean
  notify_comments: boolean
  notify_messages: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  media_url: string
  media_type: MediaType
  caption: string
  hashtags: string[]
  is_clip: boolean
  created_at: string
  profiles?: Profile
}

export interface EnrichedPost extends Post {
  like_count: number
  comment_count: number
  liked: boolean
  saved: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: MediaType
  created_at: string
  expires_at: string
  profiles?: Profile
}

export interface Conversation {
  id: string
  created_at: string
  last_message_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  deleted_at: string | null
}

export interface AppNotification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  post_id: string | null
  conversation_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
}
