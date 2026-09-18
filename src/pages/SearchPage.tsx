import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { searchHashtags, searchPeople } from '../services/profiles'
import { Avatar } from '../components/Avatar'
import { PostGrid } from '../components/PostGrid'
import { PostModal } from '../components/PostModal'
import { EmptyState } from '../components/EmptyState'
import { enrichFromRaw } from '../services/searchHelpers'
import type { EnrichedPost, Profile } from '../types'

export function SearchPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 300)
  const [people, setPeople] = useState<Profile[]>([])
  const [posts, setPosts] = useState<EnrichedPost[]>([])
  const [open, setOpen] = useState<EnrichedPost | null>(null)

  useEffect(() => {
    if (!debounced.trim() || !user) {
      setPeople([])
      setPosts([])
      return
    }
    const tagSearch = debounced.trim().startsWith('#') || !debounced.includes(' ')
    Promise.all([
      searchPeople(debounced.replace(/^#/, '')),
      tagSearch ? searchHashtags(debounced) : Promise.resolve([]),
    ])
      .then(async ([users, tagPosts]) => {
        setPeople(users)
        setPosts(await enrichFromRaw(tagPosts, user.id))
      })
      .catch(() => push('Search failed.', 'error'))
  }, [debounced, user, push])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Search</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search usernames, names, or #hashtags"
        className="mb-6 h-12 w-full rounded-full border border-zinc-200 bg-white px-5 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {!debounced && (
        <EmptyState icon={Search} title="Find people and tags" description="Try a username, display name, or hashtag." />
      )}
      {people.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold">People</h2>
          <div className="space-y-1">
            {people.map((person) => (
              <Link
                key={person.id}
                to={`/profile/${person.username}`}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white dark:hover:bg-zinc-900"
              >
                <Avatar url={person.avatar_url} name={person.username} />
                <div>
                  <p className="font-semibold">{person.username}</p>
                  <p className="text-sm text-zinc-500">{person.display_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Hashtags</h2>
          <PostGrid posts={posts} onOpen={setOpen} />
        </section>
      )}
      <PostModal
        post={open}
        onClose={() => setOpen(null)}
        onChange={(next) => {
          setPosts((list) => list.map((p) => (p.id === next.id ? next : p)))
          setOpen(next)
        }}
      />
    </div>
  )
}
