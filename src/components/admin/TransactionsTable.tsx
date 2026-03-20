'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XCircle, Eye } from 'lucide-react'
import { ApproveRejectButtons } from './ApproveRejectButtons'

const statusColor: Record<string, string> = {
  PENDING: 'text-orange-500 bg-orange-500/10',
  APPROVED: 'text-green-500 bg-green-500/10',
  REJECTED: 'text-red-500 bg-red-500/10',
  COMPLETED: 'text-gray-400 bg-gray-400/10',
}

export default function TransactionsTable({ transactions }: { transactions: any[] }) {
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0d0d12]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              {['User', 'Type', 'Amount', 'Status', 'Method', 'Receipt', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-6 py-4 text-[10px] font-black text-[#555] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-white">{tx.user?.username}</p>
                  <p className="text-[#555] text-[10px]">{tx.user?.email}</p>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-[#888]">{tx.type}</td>
                <td className="px-6 py-4 font-mono font-black text-green-500">${Number(tx.amount).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${statusColor[tx.status] || ''}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#888]">{tx.paymentMethod || '—'}</td>
                <td className="px-6 py-4">
                  {tx.proofImage ? (
                    <div className="flex flex-col gap-1 items-start">
                      <button 
                        onClick={() => setSelectedProof(tx.proofImage)}
                        className="text-orange-500 hover:text-orange-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1 transition-colors"
                      >
                       <Eye size={10} /> View Proof
                      </button>
                      <img 
                        src={tx.proofImage} 
                        alt="Receipt" 
                        onClick={() => setSelectedProof(tx.proofImage)}
                        className="w-10 h-10 object-cover rounded border border-white/10 cursor-pointer hover:border-orange-500/50 transition-all" 
                      />
                    </div>
                  ) : (
                    <span className="text-[#333] font-mono text-[9px] uppercase">{tx.paymentReference || 'No Receipt'}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-[#555]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {tx.status === 'PENDING' ? <ApproveRejectButtons txId={tx.id} /> : <span className="text-[10px] text-[#333]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="py-20 text-center text-[#333] text-[10px] font-black uppercase tracking-[0.2em]">
          No Transaction Records Found
        </div>
      )}

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProof(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 -mt-12">
                 <button 
                  onClick={() => setSelectedProof(null)}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                 >
                   <XCircle />
                 </button>
               </div>
               <div className="w-full h-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-black">
                 <img src={selectedProof} alt="Full Proof" className="w-full h-full object-contain" />
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
