'use client'

import { useState, useTransition } from 'react'
import { suspendUser, unsuspendUser, activateUser, getAllUsers } from '@/app/actions/adminActions'
import { Search, Shield, ShieldOff, CheckCircle, Users } from 'lucide-react'

interface User {
  id: string, email: string, username: string, role: string,
  isActive: boolean, isEmailVerified: boolean, isSuspended: boolean,
  mainBalance: any, gameBalance: any, country: string, createdAt: Date
}

export function AdminUsersClient({ initialUsers, total, pages, lang }: {
  initialUsers: User[], total: number, pages: number, lang: string
}) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getAllUsers(1, search)
      setUsers(result.users as User[])
    })
  }

  const handleSuspend = (userId: string, suspend: boolean) => {
    startTransition(async () => {
      if (suspend) await suspendUser(userId)
      else await unsuspendUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: suspend } : u))
    })
  }

  const handleActivate = (userId: string) => {
    startTransition(async () => {
      await activateUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u))
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[var(--purple)]" />
            <span className="text-[10px] font-black text-[var(--purple)] uppercase tracking-widest">User Management</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
            All Users <span className="text-[var(--text-tertiary)]">({total})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username or email..."
            className="px-3 py-2 text-xs rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] w-64"
          />
          <button onClick={handleSearch} className="p-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
            <tr>
              {['User', 'Status', 'Role', 'Main $', 'Game $', 'Country', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-[var(--text-primary)]">{user.username}</p>
                  <p className="text-[var(--text-tertiary)]">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit ${
                      user.isSuspended ? 'bg-[var(--error)]/10 text-[var(--error)]' :
                      user.isActive ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                      'bg-[var(--gold)]/10 text-[var(--gold)]'
                    }`}>
                      {user.isSuspended ? 'Suspended' : user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isEmailVerified && <span className="text-[var(--accent)] text-[9px]">✓ Verified</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.role === 'ADMIN' ? 'bg-[var(--purple)]/10 text-[var(--purple)]' : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[var(--accent)]">${Number(user.mainBalance).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-[var(--purple)]">${Number(user.gameBalance).toFixed(2)}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{user.country}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!user.isActive && !user.isSuspended && (
                      <button onClick={() => handleActivate(user.id)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[9px] font-black hover:bg-[var(--accent)]/20 transition-colors">
                        <CheckCircle className="w-3 h-3" /> Activate
                      </button>
                    )}
                    {!user.isSuspended ? (
                      <button onClick={() => handleSuspend(user.id, true)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] text-[9px] font-black hover:bg-[var(--error)]/20 transition-colors">
                        <ShieldOff className="w-3 h-3" /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => handleSuspend(user.id, false)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[9px] font-black hover:bg-[var(--accent)]/20 transition-colors">
                        <Shield className="w-3 h-3" /> Unsuspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">No users found</div>
        )}
      </div>
    </div>
  )
}
