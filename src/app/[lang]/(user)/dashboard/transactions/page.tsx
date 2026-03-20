'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, CheckCircle2, XCircle, Search, Filter, Loader2 } from 'lucide-react'
import { getAllTransactions } from '@/app/actions/walletActions'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [dict, setDict] = useState<any>(null)
  const { lang } = useParams()

  useEffect(() => {
    async function loadData() {
      try {
        const [txs, d] = await Promise.all([
          getAllTransactions(),
          getDictionary(lang as Locale)
        ])
        setTransactions(txs)
        setDict(d)
      } catch (error) {
        console.error('Failed to load transactions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [lang])

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || tx.type === filterType
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-orange-500" />
    }
  }

  const getTypeStyle = (type: string) => {
    if (['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(type)) return 'bg-green-500/10 text-green-500'
    if (type === 'TRANSFER') return 'bg-blue-500/10 text-blue-500'
    return 'bg-orange-500/10 text-orange-500'
  }

  return (
    <div className="pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">{dict?.transactions?.title || 'Audit Log'}</h1>
        <p className="text-[#888] mt-2">{dict?.transactions?.desc || 'Complete history of all node operations and capital movements.'}</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-[#0d0d14] border border-white/5 rounded-md pl-12 pr-4 text-sm text-white focus:border-[var(--accent)] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-12 bg-[#0d0d14] border border-white/5 rounded-md px-4 text-xs font-bold uppercase tracking-widest text-[#888] outline-none focus:border-[var(--accent)] transition-all cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="EARNING">Earnings</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER">Transfers</option>
            <option value="GAME_WIN">Game Winnings</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555]">Protocol/Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555]">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">{tx.notes || tx.type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-[#555] font-mono mt-0.5">{new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border border-current opacity-80 ${getTypeStyle(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{tx.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-mono font-bold ${['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? 'text-green-500' : tx.type === 'TRANSFER' ? 'text-blue-400' : 'text-orange-500'}`}>
                        {['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? '+' : tx.type === 'TRANSFER' ? '~' : '-'}${Number(tx.amount).toFixed(2)}
                      </span>
                      {tx.currency && tx.currency !== 'USD' && (
                         <span className="text-[9px] text-[#444] font-mono">{tx.currency}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="py-20 text-center">
            <div className="bg-[#1a1a24] w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Filter className="w-5 h-5 text-[#333]" />
            </div>
            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">No relevant protocols found</h3>
            <p className="text-[9px] text-[#333] mt-1 uppercase">Adjust your parameters or initiate new node cycles.</p>
          </div>
        )}
      </div>
    </div>
  )
}
