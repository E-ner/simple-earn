'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { getTicketMessages, sendTicketMessage } from '@/app/actions/supportActions'
import { Send, ArrowLeft, Loader2, User, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/context/ToastContext'

export default function TicketConversationPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversation()
    // Poll for new messages every 15 seconds (simulated real-time)
    const interval = setInterval(loadConversation, 15000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [ticket?.messages])

  async function loadConversation() {
    try {
      const data = await getTicketMessages(ticketId)
      setTicket(data)
    } catch (error) {
      console.error('Failed to load conversation:', error)
      router.push('/en/dashboard/support')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    const originalMessage = message
    setMessage('')

    try {
      await sendTicketMessage(ticketId, originalMessage)
      await loadConversation()
    } catch (error: any) {
      showToast(error.message || 'Transmission failed', 'ERROR')
      setMessage(originalMessage)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-(--bg-base)">
        <Loader2 className="w-8 h-8 text-(--accent) animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-(--bg-base) flex flex-col pt-16">
      {/* Conversation Header */}
      <header className="h-16 border-b border-(--border) px-6 flex items-center justify-between bg-(--bg-base)/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/en/dashboard/support')}
            className="w-10 h-10 rounded-md bg-(--surface-2) flex items-center justify-center hover:bg-(--surface-3) transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-(--text-primary)" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-(--text-primary)">{ticket.subject}</h2>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-(--text-secondary) uppercase tracking-widest">
                 ID: {ticket.id.slice(0, 8).toUpperCase()}
               </span>
               <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'CLOSED' ? 'bg-[#555]' : 'bg-(--accent) animate-pulse'}`} />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-(--text-primary) uppercase tracking-tighter">Protocol Support</p>
            <p className="text-[9px] text-(--accent) uppercase font-bold tracking-widest">Live Channel</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-(--accent)/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-(--accent)" />
          </div>
        </div>
      </header>

      {/* Messages Window */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10"
      >
        <div className="max-w-4xl mx-auto space-y-10 py-10">
          <AnimatePresence mode="popLayout">
            {ticket.messages.map((msg: any) => {
              const isAdmin = msg.sender.role === 'ADMIN'
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center border ${
                    isAdmin ? 'bg-(--accent)/10 border-(--accent)/20 text-(--accent)' : 'bg-(--surface-2) border-(--border) text-(--text-secondary)'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div className={`flex flex-col gap-2 max-w-[80%] ${isAdmin ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-(--accent)' : 'text-[#888]'}`}>
                         {isAdmin ? 'System Auditor' : msg.sender.username}
                       </span>
                       <span className="text-[9px] font-bold text-[#444]">{format(new Date(msg.createdAt), 'p')}</span>
                    </div>
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      isAdmin ? 'bg-(--surface-2) border border-(--border) text-(--text-primary)' : 'bg-(--accent) text-(--text-inverse) font-medium'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <footer className="p-6 border-t border-(--border) bg-(--bg-base)">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative">
            <textarea 
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Transmit message to protocol audit..."
              className="w-full bg-(--surface-2) border border-(--border) rounded-2xl px-6 py-4 pr-16 text-sm text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:border-(--accent) transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
            />
            <button 
              type="submit"
              disabled={!message.trim() || sending}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-(--accent) text-black flex items-center justify-center hover:bg-(--accent-hover) transition-all disabled:opacity-30 disabled:grayscale"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="mt-4 text-center text-[9px] font-black text-[#333] uppercase tracking-[0.2em] uppercase">
            Encrypted End-to-End Protocol Channel
          </p>
        </div>
      </footer>
    </div>
  )
}
