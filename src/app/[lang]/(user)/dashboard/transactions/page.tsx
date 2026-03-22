'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, CheckCircle2, XCircle, Search, Filter, Loader2, ChevronDown } from 'lucide-react'
import { getAllTransactions, getWalletData } from '@/app/actions/walletActions'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import { formatCurrency, formatRaw, getCurrencyFromCountry } from '@/lib/currency'

const PAGE_SIZE = 15

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [dict, setDict] = useState<any>(null)
  const { lang } = useParams()

  useEffect(() => {
    async function loadData() {
      try {
        const [txs, walletData, d] = await Promise.all([
          getAllTransactions(),
          getWalletData(),
          getDictionary(lang as Locale)
        ])
        setAllTransactions(txs) // already ordered desc (most recent first)
        setCountry(walletData.country || 'US')
        setDict(d)
      } catch (error) {
        console.error('Failed to load transactions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [lang])

  // Reset pagination on filter/search change
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [searchTerm, filterType])

  const currency = getCurrencyFromCountry(country)

  function txAmount(tx: any): string {
    const externalTypes = ['DEPOSIT', 'WITHDRAWAL', 'ACTIVATION', 'GAME_DEPOSIT']
    if (externalTypes.includes(tx.type) && tx.localAmount) {
      return formatRaw(tx.localAmount, tx.currency || currency)
    }
    return formatCurrency(tx.amount, currency)
  }

  const filtered = allTransactions.filter(tx => {
    const matchesSearch =
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || tx.type === filterType
    return matchesSearch && matchesFilter
  })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const remaining = filtered.length - visibleCount

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-(--accent) animate-spin" />
    </div>
  )

  const getStatusIcon = (status: string) => {
    if (['COMPLETED', 'APPROVED'].includes(status)) return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (['REJECTED', 'FAILED'].includes(status)) return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-orange-500" />
  }

  const getTypeStyle = (type: string) => {
    if (['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(type)) return 'bg-green-500/10 text-green-500'
    if (type === 'TRANSFER') return 'bg-blue-500/10 text-blue-500'
    return 'bg-orange-500/10 text-orange-500'
  }

  const getSign = (type: string) => {
    if (['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(type)) return '+'
    if (type === 'TRANSFER') return '~'
    return '-'
  }

  const getAmountColor = (type: string) => {
    if (['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(type)) return 'text-green-500'
    if (type === 'TRANSFER') return 'text-blue-400'
    return 'text-orange-500'
  }

  return (
    <div className="pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">{dict?.transactions?.title || 'Audit Log'}</h1>
        <p className="text-(--text-secondary) mt-2">
          {dict?.transactions?.desc || 'Complete history of all node operations and capital movements.'}
          <span className="ml-2 text-[10px] font-black text-(--accent) uppercase tracking-widest">· {currency}</span>
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-(--surface-2) border border-(--border) rounded-md pl-12 pr-4 text-sm text-(--text-primary) focus:border-(--accent) outline-none transition-all"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-12 bg-(--surface-2) border border-(--border) rounded-md px-4 text-xs font-bold uppercase tracking-widest text-(--text-secondary) outline-none focus:border-(--accent) transition-all cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="EARNING">Earnings</option>
          <option value="DEPOSIT">Deposits</option>
          <option value="WITHDRAWAL">Withdrawals</option>
          <option value="TRANSFER">Transfers</option>
          <option value="GAME_WIN">Game Winnings</option>
          <option value="GAME_LOSS">Game Losses</option>
          <option value="ACTIVATION">Activation</option>
        </select>
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] text-(--text-tertiary) uppercase tracking-widest font-bold mb-4">
          Showing {visible.length} of {filtered.length}
        </p>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border) bg-(--surface-2)">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-(--text-secondary)">Transaction / Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555]">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#555] text-right">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {visible.map((tx, i) => (
                <motion.tr key={tx.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="hover:bg-(--surface-3) transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-(--text-primary) group-hover:text-(--accent) transition-colors">
                        {tx.notes || tx.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#555] font-mono mt-0.5">{new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border border-current opacity-80 ${getTypeStyle(tx.type)}`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{tx.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-sm font-mono font-bold ${getAmountColor(tx.type)}`}>
                      {getSign(tx.type)}{txAmount(tx)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="p-5 border-t border-(--border) text-center">
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-(--surface-2) hover:bg-(--surface-3) border border-(--border) rounded-lg text-[10px] font-black text-(--text-secondary) uppercase tracking-widest transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Load {Math.min(PAGE_SIZE, remaining)} more · {remaining} remaining
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="bg-(--surface-2) w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-(--border)">
              <Filter className="w-5 h-5 text-(--text-tertiary)" />
            </div>
            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">No transactions found</h3>
            <p className="text-[9px] text-[#333] mt-1 uppercase">Adjust your filters or make your first transaction.</p>
          </div>
        )}
      </div>
    </div>
  )
}