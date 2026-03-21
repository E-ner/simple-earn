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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-(--purple)" />
            <span className="text-[10px] font-black text-(--purple) uppercase tracking-widest">User Management</span>
          </div>
          <h1 className="text-2xl font-black text-(--text-primary) tracking-tighter">
            All Users <span className="text-(--text-tertiary)">({total})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username or email..."
            className="px-3 py-2 text-xs rounded-md bg-(--surface-2) border border-(--border) text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-(--border-focus) w-full sm:w-64"
          />
          <button onClick={handleSearch} className="p-2 rounded-md bg-(--surface-2) border border-(--border) text-(--text-tertiary) hover:text-(--text-primary) transition-colors shrink-0">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border border-(--border) rounded-xl overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead className="bg-(--surface) border-b border-(--border)">
            <tr>
              {['User', 'Status', 'Role', 'Main $', 'Game $', 'Country', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-(--border) hover:bg-(--surface-2) transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-(--text-primary)">{user.username}</p>
                  <p className="text-(--text-tertiary)">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit ${
                      user.isSuspended ? 'bg-(--error)/10 text-(--error)' :
                      user.isActive ? 'bg-(--accent)/10 text-(--accent)' :
                      'bg-(--gold)/10 text-(--gold)'
                    }`}>
                      {user.isSuspended ? 'Suspended' : user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isEmailVerified && <span className="text-(--accent) text-[9px]">✓ Verified</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.role === 'ADMIN' ? 'bg-(--purple)/10 text-(--purple)' : 'bg-(--surface-3) text-(--text-tertiary)'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-(--accent)">${Number(user.mainBalance).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-(--purple)">${Number(user.gameBalance).toFixed(2)}</td>
                <td className="px-4 py-3 text-(--text-tertiary)">{user.country}</td>
                <td className="px-4 py-3 text-(--text-tertiary)">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!user.isActive && !user.isSuspended && (
                      <button onClick={() => handleActivate(user.id)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-[9px] font-black hover:bg-(--accent)/20 transition-colors">
                        <CheckCircle className="w-3 h-3" /> Activate
                      </button>
                    )}
                    {!user.isSuspended ? (
                      <button onClick={() => handleSuspend(user.id, true)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-(--error)/10 border border-(--error)/20 text-(--error) text-[9px] font-black hover:bg-(--error)/20 transition-colors">
                        <ShieldOff className="w-3 h-3" /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => handleSuspend(user.id, false)} disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-[9px] font-black hover:bg-(--accent)/20 transition-colors">
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
          <div className="py-16 text-center text-sm text-(--text-tertiary)">No users found</div>
        )}
      </div>
    </div>
  )
}
