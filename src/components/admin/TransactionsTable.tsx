'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XCircle, Eye, ImageOff } from 'lucide-react'
import { ApproveRejectButtons } from './ApproveRejectButtons'
import { formatRaw, formatCurrency } from '@/lib/currency'

const statusColor: Record<string, string> = {
  PENDING: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  APPROVED: 'text-green-500 bg-green-500/10 border-green-500/20',
  REJECTED: 'text-red-500 bg-red-500/10 border-red-500/20',
  COMPLETED: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
}

const typeColor: Record<string, string> = {
  DEPOSIT: 'text-green-400',
  WITHDRAWAL: 'text-orange-400',
  ACTIVATION: 'text-purple-400',
  GAME_DEPOSIT: 'text-blue-400',
  TRANSFER: 'text-blue-400',
  EARNING: 'text-green-400',
  GAME_WIN: 'text-green-400',
  GAME_LOSS: 'text-red-400',
}

/**
 * Proof images are saved to /public/uploads/proofs/<filename>
 * and served at /uploads/proofs/<filename>.
 * This normalises any stray path prefixes that may have crept in.
 */
function resolveProofUrl(raw: string): string {
  if (!raw) return ''
  // Already a full URL (e.g. Cloudinary / S3)
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  // Strip any accidental leading segments and ensure /uploads/proofs/ prefix
  const filename = raw.split('/').pop() ?? raw
  return `/uploads/proofs/${filename}`
}

/**
 * Format amount for display in admin table.
 * Show localAmount in stored currency when available (external txs),
 * otherwise show amount in USD.
 */
function formatTxAmount(tx: any): string {
  const externalTypes = ['DEPOSIT', 'WITHDRAWAL', 'ACTIVATION', 'GAME_DEPOSIT']
  if (externalTypes.includes(tx.type) && tx.localAmount && tx.currency && tx.currency !== 'USD') {
    return formatRaw(tx.localAmount, tx.currency)
  }
  return `$${Number(tx.amount).toFixed(2)}`
}

export default function TransactionsTable({ transactions }: { transactions: any[] }) {
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  const handleImgError = (url: string) => {
    setImgErrors(prev => new Set(prev).add(url))
  }

  return (
    <div className="border border-(--border) rounded-xl overflow-hidden bg-(--surface)">
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[900px] text-xs text-left">
          <thead className="bg-(--surface-2) border-b border-(--border)">
            <tr>
              {['User', 'Type', 'Amount', 'Status', 'Method / Ref', 'Receipt', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-4 text-[10px] font-black text-[#555] uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {transactions.map((tx: any) => {
              const proofUrl = tx.proofImage ? resolveProofUrl(tx.proofImage) : null
              const imgBroken = proofUrl ? imgErrors.has(proofUrl) : false

              return (
                <tr key={tx.id} className="hover:bg-(--surface-3) transition-colors">
                  {/* User */}
                  <td className="px-4 py-4 min-w-[140px]">
                    <p className="font-bold text-(--text-primary) truncate max-w-[120px]">{tx.user?.username}</p>
                    <p className="text-(--text-secondary) text-[10px] truncate max-w-[120px]">{tx.user?.email}</p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`font-black text-[10px] uppercase tracking-wider ${typeColor[tx.type] ?? 'text-[#888]'}`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="font-mono font-black text-green-500">{formatTxAmount(tx)}</p>
                    {/* Show USD equivalent when local currency differs */}
                    {tx.currency && tx.currency !== 'USD' && tx.localAmount && (
                      <p className="text-[9px] text-[#555] font-mono">≈ ${Number(tx.amount).toFixed(2)} USD</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${statusColor[tx.status] ?? ''}`}>
                      {tx.status}
                    </span>
                  </td>

                  {/* Method / Ref */}
                  <td className="px-4 py-4 min-w-[120px]">
                    <p className="text-(--text-secondary) text-[10px] font-bold">{tx.paymentMethod || '—'}</p>
                    {tx.paymentReference && (
                      <p className="text-[9px] text-[#555] font-mono truncate max-w-[110px]" title={tx.paymentReference}>
                        {tx.paymentReference}
                      </p>
                    )}
                  </td>

                  {/* Receipt */}
                  <td className="px-4 py-4">
                    {proofUrl && !imgBroken ? (
                      <div className="flex flex-col gap-1.5 items-start">
                        <button
                          onClick={() => setSelectedProof(proofUrl)}
                          className="text-orange-500 hover:text-orange-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <Eye size={10} /> View
                        </button>
                        <img
                          src={proofUrl}
                          alt="Receipt"
                          onClick={() => setSelectedProof(proofUrl)}
                          onError={() => handleImgError(proofUrl)}
                          className="w-10 h-10 object-cover rounded border border-white/10 cursor-pointer hover:border-orange-500/50 transition-all"
                        />
                      </div>
                    ) : proofUrl && imgBroken ? (
                      <div className="flex items-center gap-1 text-[9px] text-[#555]">
                        <ImageOff size={10} />
                        <span className="uppercase font-mono">Missing</span>
                      </div>
                    ) : (
                      <span className="text-[#333] font-mono text-[9px] uppercase">No receipt</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 text-[#555] whitespace-nowrap text-[10px]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                    <p className="text-[9px] text-[#444]">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    {tx.status === 'PENDING'
                      ? <ApproveRejectButtons txId={tx.id} />
                      : <span className="text-[10px] text-[#333]">—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="py-20 text-center text-[#333] text-[10px] font-black uppercase tracking-[0.2em]">
          No Transaction Records Found
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedProof(null)}
            className="fixed inset-0 z-[100] bg-(--bg-base)/80 flex items-center justify-center p-8 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <XCircle />
              </button>
              <div className="w-full rounded-2xl border border-(--border) overflow-hidden bg-(--surface) max-h-[80vh] flex items-center justify-center">
                <img src={selectedProof} alt="Full Proof" className="max-w-full max-h-[80vh] object-contain" />
              </div>
              <p className="text-[10px] text-[#555] font-mono break-all">{selectedProof}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}