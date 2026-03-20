'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react'
import { createTicket, getUserTickets } from '@/app/actions/supportActions'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/context/ToastContext'

export default function SupportPage() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // New ticket form
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    try {
      const data = await getUserTickets()
      setTickets(data)
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !message) return

    setSubmitting(true)
    try {
      await createTicket(subject, message)
      showToast('Support ticket initiated', 'SUCCESS')
      setSubject('')
      setMessage('')
      setIsCreating(false)
      loadTickets()
    } catch (error: any) {
      showToast(error.message || 'Failed to create ticket', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Support Terminal</h1>
          <p className="text-[#888] max-w-2xl leading-relaxed">
            Communicate directly with the protocol audit team. Real-time assistance for account and transaction verifications.
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="h-10 px-6 rounded-md bg-[var(--accent)] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-colors"
        >
          {isCreating ? 'Cancel Request' : <><Plus className="w-4 h-4" /> Open Ticket</>}
        </button>
      </header>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-md bg-white/[0.02] border border-[var(--accent)]/20 relative"
        >
          <form onSubmit={handleCreateTicket} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">Subject Matter</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe the inquiry (e.g. Deposit Verification)"
                className="input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">Detailed Intent</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide comprehensive details regarding your request..."
                className="input min-h-[120px] py-4"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#ddd] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Initializing Channel...' : 'Submit Request'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/en/dashboard/support/${ticket.id}`}>
            <motion.div 
              whileHover={{ x: 4 }}
              className="p-6 rounded-md bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
                  ticket.status === 'OPEN' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                  ticket.status === 'IN_PROGRESS' ? 'bg-[var(--purple)]/10 text-[var(--purple)]' :
                  'bg-white/5 text-[#444]'
                }`}>
                  {ticket.status === 'OPEN' ? <AlertCircle className="w-5 h-5" /> : 
                   ticket.status === 'IN_PROGRESS' ? <Clock className="w-5 h-5" /> : 
                   <CheckCircle2 className="w-5 h-5" />}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-[#444] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                      ID: {ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">{ticket.subject}</h3>
                  </div>
                  <p className="text-xs text-[#555] line-clamp-1 max-w-md">
                    {ticket.messages[0]?.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                    {format(new Date(ticket.updatedAt), 'MMM dd, p')}
                  </p>
                  <p className="text-[9px] text-[#444] uppercase font-bold tracking-widest">Last Activity</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#333] group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          </Link>
        ))}

        {tickets.length === 0 && !isCreating && (
          <div className="py-20 text-center space-y-4 rounded-md border border-dashed border-white/[0.05]">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.02] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#222]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white uppercase tracking-widest uppercase">Communication Log Empty</p>
              <p className="text-xs text-[#444] tracking-tight">No support interactions currently registered in the protocol.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
