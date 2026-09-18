import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import { Modal } from './Modal'
import type { Profile } from '../types'

export function UserListModal({
  open,
  title,
  users,
  onClose,
}: {
  open: boolean
  title: string
  users: Profile[]
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="max-h-[60vh] space-y-1 overflow-y-auto p-3">
        {users.length === 0 && <p className="px-2 py-8 text-center text-sm text-zinc-500">No users yet.</p>}
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.username}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Avatar url={user.avatar_url} name={user.username} />
            <div>
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-zinc-500">{user.display_name}</p>
            </div>
          </Link>
        ))}
      </div>
    </Modal>
  )
}
