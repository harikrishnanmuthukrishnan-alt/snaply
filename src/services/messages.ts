import { supabase } from '../lib/supabase'
import type { Message, Profile } from '../types'

export interface ConversationPreview {
  id: string
  last_message_at: string
  other: Profile | null
  last_message: string | null
}

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  const { data: memberships, error } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations(*)')
    .eq('user_id', userId)
  if (error) throw error

  const convos = (memberships ?? []) as unknown as {
    conversation_id: string
    conversations: { id: string; last_message_at: string }
  }[]

  const results: ConversationPreview[] = []
  for (const row of convos) {
    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profiles(*)')
      .eq('conversation_id', row.conversation_id)

    const other = ((members ?? []) as unknown as { user_id: string; profiles: Profile }[])
      .find((m) => m.user_id !== userId)?.profiles ?? null

    const { data: last } = await supabase
      .from('messages')
      .select('content, deleted_at')
      .eq('conversation_id', row.conversation_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    results.push({
      id: row.conversation_id,
      last_message_at: row.conversations?.last_message_at ?? new Date().toISOString(),
      other,
      last_message: last?.deleted_at ? 'Message deleted' : (last?.content ?? null),
    })
  }

  return results.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
}

export async function getOrCreateConversation(otherUserId: string) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    other_user_id: otherUserId,
  })
  if (error) throw error
  return data as string
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Message
}

export async function deleteOwnMessage(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString(), content: ' ' })
    .eq('id', messageId)
  if (error) throw error
}
