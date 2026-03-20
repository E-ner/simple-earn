import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!adminUser) return null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-8 h-8 text-[var(--accent)]" />
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Admin Profile</h1>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 rounded-full bg-[var(--surface-2)] border-4 border-[var(--border)] flex items-center justify-center text-5xl font-black text-[var(--text-secondary)] uppercase">
          {adminUser.username.charAt(0)}
        </div>
        
        <div className="space-y-6 flex-1">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{adminUser.username}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> System Administrator
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest flex items-center gap-1"><Mail className="w-3 h-3"/> Email Address</label>
              <p className="text-sm font-bold text-[var(--text-primary)]">{adminUser.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3"/> Joined Date</label>
              <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(adminUser.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest flex items-center gap-1">Node Country</label>
              <p className="text-sm font-bold text-[var(--text-primary)]">{adminUser.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
