import { getAdminStats, getPendingTransactions } from '@/app/actions/adminActions'
import { ShieldCheck, Users, CreditCard, TrendingUp, MessageSquare, Clock, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { ApproveRejectButtons } from '@/components/admin/ApproveRejectButtons'
import AdminCharts from '@/components/admin/AdminCharts'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-black text-[var(--text-primary)] tracking-tighter font-mono mb-1">{value}</div>
      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-bold">{label}</div>
    </div>
  )
}

export default async function AdminDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const [stats, pending] = await Promise.all([getAdminStats(), getPendingTransactions()])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[var(--purple)]" />
          <span className="text-[10px] font-black text-[var(--purple)] uppercase tracking-widest">Root Administration</span>
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">System Overview</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Full platform control and management dashboard.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="var(--purple)" />
        <StatCard label="Active Nodes" value={stats.activeUsers} icon={ShieldCheck} color="var(--accent)" />
        <StatCard label="Pending Approvals" value={stats.pendingTx} icon={Clock} color="var(--gold)" />
        <StatCard label="Total Deposits" value={`$${stats.totalDeposits.toFixed(2)}`} icon={ArrowUpRight} color="var(--accent)" />
        <StatCard label="Total Payouts" value={`$${stats.totalPayout.toFixed(2)}`} icon={ArrowDownLeft} color="var(--error)" />
      </div>

      {/* Advanced Analytics Charts */}
      <AdminCharts 
        userGrowth={stats.userGrowth}
        cashflow={stats.cashflow}
        statusDistribution={[
          { name: 'Active Nodes', value: stats.activeUsers },
          { name: 'Inactive Nodes', value: stats.inactiveUsers }
        ]}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {[
          { label: 'Users', path: 'users' },
          { label: 'Transactions', path: 'transactions' },
          { label: 'Content', path: 'content' },
          { label: 'Games', path: 'games' },
          { label: 'Payments', path: 'payments' },
          { label: 'Support', path: 'support' },
        ].map(link => (
          <Link key={link.path} href={`/${lang}/admin/${link.path}`}
            className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Pending Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Pending Approvals</h2>
          <Link href={`/${lang}/admin/transactions`} className="text-[10px] text-[var(--accent)] hover:underline font-bold uppercase tracking-widest">View All</Link>
        </div>

        {pending.length === 0 ? (
          <div className="py-16 text-center border border-[var(--border)] rounded-xl">
            <Check className="w-8 h-8 text-[var(--accent)] mx-auto mb-3" />
            <p className="text-sm font-bold text-[var(--text-tertiary)]">All clear — no pending approvals</p>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                <tr>
                  {['User', 'Type', 'Amount', 'Method', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 10).map((tx: any) => (
                  <tr key={tx.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[var(--text-primary)]">{tx.user.username}</p>
                      <p className="text-[var(--text-tertiary)]">{tx.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-secondary)]">{tx.type}</td>
                    <td className="px-4 py-3 font-mono font-black text-[var(--accent)]">${Number(tx.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">{tx.paymentMethod || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><ApproveRejectButtons txId={tx.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
