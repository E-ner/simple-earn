'use client'

import { motion } from 'framer-motion'
import { Prisma } from '@prisma/client'
import { BarChart3 } from 'lucide-react'

interface RecentActivityProps {
  transactions: (any & { dateFormatted: string })[]
  currency: string
  dict: any
}

import { formatCurrency } from '@/lib/currency'

export default function RecentActivity({ transactions, currency, dict }: RecentActivityProps) {
  return (
    <motion.div
      className="mt-8 card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="p-6 border-b border-(--border) flex items-center justify-between">
        <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
          {dict?.dashboard?.recent_activity || 'Recent Activity'}
        </h3>
        <button className="text-sm text-(--accent) hover:text-(--accent-hover) font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] font-mono uppercase tracking-wider text-(--text-tertiary) bg-(--surface-2)">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold opacity-0 sm:opacity-100">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-(--surface-2) transition-colors">
                <td className="px-6 py-4 text-(--text-secondary) whitespace-nowrap">{tx.dateFormatted}</td>
                <td className="px-6 py-4 font-medium text-(--text-primary)">{tx.type?.replace('_', ' ')}</td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className={
                    tx.status === 'COMPLETED' || tx.status === 'APPROVED' ? 'badge-success' :
                      tx.status === 'PENDING' ? 'badge-pending' : 'badge-error'
                  }>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={Number(tx.amount) > 0 ? 'amount-positive' : 'amount-neutral'}>
                    {Number(tx.amount) > 0 ? '+' : ''}{formatCurrency(Number(tx.amount), currency)}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-(--radius-xl) bg-(--surface-2) border border-(--border) flex items-center justify-center mb-2">
                       <BarChart3 className="w-6 h-6 text-(--text-tertiary)" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">Protocol Dormant</p>
                      <p className="text-xs text-(--text-tertiary) max-w-[200px] mx-auto leading-relaxed italic">
                        No cryptographic activity detected in the current epoch. Initialize a task to begin logging.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
