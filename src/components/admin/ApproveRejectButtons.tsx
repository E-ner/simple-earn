'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { approveTransaction, rejectTransaction } from '@/app/actions/adminActions'
import { Check, X, Loader2, Send } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

export function ApproveRejectButtons({ txId }: { txId: string }) {
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveTransaction(txId)
        showToast('Transaction approved and protocol balances updated.', 'SUCCESS')
      } catch (error: any) {
        showToast(error.message || 'Approval failed', 'ERROR')
      }
    })
  }

  const handleReject = () => {
    if (!showReject) { setShowReject(true); return }
    if (!rejectReason) {
      showToast('Please provide a rejection reason.', 'WARNING')
      return
    }
    
    startTransition(async () => {
      try {
        await rejectTransaction(txId, rejectReason)
        showToast('Transaction rejected and user notified.', 'SUCCESS')
        setShowReject(false)
      } catch (error: any) {
        showToast(error.message || 'Rejection failed', 'ERROR')
      }
    })
  }

  if (isPending) return <Loader2 className="w-4 h-4 animate-spin text-(--accent)" />

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!showReject && (
          <button
            onClick={handleApprove}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-[10px] font-black uppercase tracking-wider hover:bg-(--accent)/20 transition-all hover:scale-105 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
        )}
        <button
          onClick={handleReject}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
            showReject 
              ? 'bg-(--error) text-white' 
              : 'bg-(--error)/10 border border-(--error)/20 text-(--error) hover:bg-(--error)/20'
          }`}
        >
          {showReject ? <Send className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {showReject ? 'Confirm Reject' : 'Reject'}
        </button>
        {showReject && (
          <button 
            onClick={() => setShowReject(false)}
            className="p-1.5 rounded-md hover:bg-(--surface-3) text-(--text-tertiary) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {showReject && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <input
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Audit Failure Reason..."
            autoFocus
            className="w-full text-[10px] px-3 py-2 rounded-md bg-(--surface-2) border border-(--error)/30 text-(--text-primary) focus:outline-none focus:border-(--error) placeholder:text-[#444] font-bold"
          />
        </motion.div>
      )}
    </div>
  )
}

