import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageCircle, Search, Send, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { searchPeople, fetchProfileByUsername } from '../services/profiles'
import {
  deleteOwnMessage,
  fetchMessages,
  getOrCreateConversation,
  listConversations,
  sendMessage,
  type ConversationPreview,
} from '../services/messages'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { timeAgo } from '../lib/utils'
import type { Message, Profile } from '../types'

export function MessagesPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [params] = useSearchParams()
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 300)
  const [hits, setHits] = useState<Profile[]>([])
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const refreshConvos = useCallback(async () => {
    if (!user) return
    setConversations(await listConversations(user.id))
  }, [user])

  useEffect(() => {
    void refreshConvos().catch(() => push('Could not load conversations.', 'error'))
  }, [user, refreshConvos, push])

  useEffect(() => {
    const uname = params.get('user')
    if (!uname || !user) return
    fetchProfileByUsername(uname)
      .then(async (p) => {
        if (!p) return
        const id = await getOrCreateConversation(p.id)
        setActive(id)
        await refreshConvos()
      })
      .catch(() => undefined)
  }, [params, user, refreshConvos])

  useEffect(() => {
    if (!debounced.trim()) {
      setHits([])
      return
    }
    searchPeople(debounced)
      .then(setHits)
      .catch(() => undefined)
  }, [debounced])

  useEffect(() => {
    if (!active) return
    fetchMessages(active)
      .then(setMessages)
      .catch(() => push('Could not load messages.', 'error'))

    const channel = supabase
      .channel(`messages:${active}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active}` },
        (payload) => {
          setMessages((list) => {
            const row = payload.new as Message
            if (list.some((m) => m.id === row.id)) return list
            return [...list, row]
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [active, push])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, active])

  async function startWith(person: Profile) {
    if (!user) return
    if (person.id === user.id) {
      push('You cannot message yourself.', 'error')
      return
    }
    const id = await getOrCreateConversation(person.id)
    setActive(id)
    setQ('')
    setHits([])
    await refreshConvos()
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!user || !active || !text.trim()) return
    const content = text.trim()
    setText('')
    try {
      const row = await sendMessage(active, user.id, content)
      setMessages((list) => (list.some((m) => m.id === row.id) ? list : [...list, row]))
      await refreshConvos()
    } catch {
      push('Message failed to send.', 'error')
    }
  }

  const current = conversations.find((c) => c.id === active)

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white md:min-h-[calc(100dvh-4rem)] md:grid-cols-[280px_minmax(0,1fr)] dark:border-zinc-800 dark:bg-zinc-900">
      <aside className={`border-r border-zinc-100 dark:border-zinc-800 ${active ? 'hidden md:block' : 'block'}`}>
        <div className="p-4">
          <h1 className="mb-3 text-xl font-semibold">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people"
              className="h-10 w-full rounded-full bg-zinc-100 pl-9 pr-3 text-sm dark:bg-zinc-800"
            />
          </div>
          {hits.length > 0 && (
            <div className="mt-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {hits.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => void startWith(person)}
                >
                  <Avatar url={person.avatar_url} name={person.username} size="sm" />
                  <span className="text-sm font-medium">{person.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {conversations.length === 0 && <p className="px-4 py-8 text-sm text-zinc-500">No conversations yet.</p>}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 ${active === c.id ? 'bg-brand/10' : ''}`}
            >
              <Avatar url={c.other?.avatar_url} name={c.other?.username} />
              <div className="min-w-0">
                <p className="truncate font-medium">{c.other?.username ?? 'Snaply user'}</p>
                <p className="truncate text-xs text-zinc-500">{c.last_message ?? 'Say hello'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <section className={`flex min-h-[70vh] flex-col ${active ? 'flex' : 'hidden md:flex'}`}>
        {!active ? (
          <div className="m-auto">
            <EmptyState icon={MessageCircle} title="Your messages" description="Search for someone to start a conversation." />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <button type="button" className="md:hidden" onClick={() => setActive(null)}>
                Back
              </button>
              <Avatar url={current?.other?.avatar_url} name={current?.other?.username} size="sm" />
              <p className="font-semibold">{current?.other?.username ?? 'Conversation'}</p>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id
                const deleted = Boolean(m.deleted_at)
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-3xl px-4 py-2 text-sm ${
                        mine ? 'bg-brand text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      <p className={deleted ? 'italic opacity-70' : ''}>{deleted ? 'Message deleted' : m.content}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                        <span>{timeAgo(m.created_at)}</span>
                        {mine && !deleted && (
                          <button type="button" aria-label="Delete message" onClick={() => setPendingDelete(m.id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={onSend} className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message..."
                className="h-11 flex-1 rounded-full bg-zinc-100 px-4 dark:bg-zinc-800"
              />
              <Button type="submit" disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete message?"
        message="This removes the message from the conversation."
        confirmLabel="Delete"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          await deleteOwnMessage(pendingDelete)
          setMessages((list) =>
            list.map((m) => (m.id === pendingDelete ? { ...m, deleted_at: new Date().toISOString() } : m)),
          )
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
