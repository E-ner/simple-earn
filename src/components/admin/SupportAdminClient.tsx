'use client'

import { useState, useTransition } from 'react'
import { replyToTicket, closeTicket, reopenTicket } from '@/app/actions/adminActions'
import { Send, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react'

interface Message {
  id: string, message: string, createdAt: Date,
  sender: { username: string, role: string }
}

interface Ticket {
  id: string, subject: string, status: string, createdAt: Date, updatedAt: Date,
  user: { username: string, email: string },
  messages: Message[]
}

const statusMeta: Record<string, { label: string, cls: string, icon: any }> = {
  OPEN:        { label: 'Open',        cls: 'bg-(--error)/10 text-(--error)',   icon: AlertCircle },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-(--gold)/10 text-(--gold)',     icon: Clock },
  CLOSED:      { label: 'Closed',      cls: 'bg-(--surface-3) text-(--text-tertiary)', icon: CheckCircle },
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(ticket.status === 'OPEN')
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState<Message[]>(ticket.messages)
  const [status, setStatus] = useState(ticket.status)
  const [isPending, startTransition] = useTransition()

  const meta = statusMeta[status] || statusMeta.OPEN

  const handleReply = () => {
    if (!reply.trim()) return
    startTransition(async () => {
      await replyToTicket(ticket.id, reply)
      setMessages(prev => [...prev, {
        id: Date.now().toString(), message: reply, createdAt: new Date(),
        sender: { username: 'Admin', role: 'ADMIN' }
      }])
      setReply('')
      if (status === 'OPEN') setStatus('IN_PROGRESS')
    })
  }

  const handleClose = () => {
    startTransition(async () => {
      await closeTicket(ticket.id)
      setStatus('CLOSED')
    })
  }

  const handleReopen = () => {
    startTransition(async () => {
      await reopenTicket(ticket.id)
      setStatus('OPEN')
    })
  }

  const StatusIcon = meta.icon

  return (
    <div className="border border-(--border) rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-(--surface-2) transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${meta.cls}`}>
              <StatusIcon className="w-3 h-3" /> {meta.label}
            </span>
            <span className="text-sm font-bold text-(--text-primary)">{ticket.subject}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-(--text-tertiary)">
            <span>From: <span className="font-bold">{ticket.user.username}</span> ({ticket.user.email})</span>
            <span>·</span>
            <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-(--text-tertiary)" /> : <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />}
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-(--border) bg-(--surface)">
          {/* Messages */}
          <div className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender.role === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender.role === 'ADMIN'
                    ? 'bg-(--purple) text-white'
                    : 'bg-(--surface-2) text-(--text-primary) border border-(--border)'
                }`}>
                  <p className="font-black text-[9px] mb-1 opacity-70">{msg.sender.username}</p>
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-(--text-tertiary) text-xs text-center py-3">No messages yet</p>}
          </div>

          {/* Reply & Actions */}
          <div className="px-5 pb-4 border-t border-(--border) pt-4 space-y-3">
            {status !== 'CLOSED' && (
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder="Type your reply..."
                  className="flex-1 px-3 py-2 rounded-lg bg-(--surface-2) border border-(--border) text-(--text-primary) text-xs focus:outline-none focus:border-(--border-focus) placeholder:text-(--text-tertiary)"
                />
                <button onClick={handleReply} disabled={isPending || !reply.trim()}
                  className="px-4 py-2 bg-(--purple) text-white font-black text-xs uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Reply
                </button>
              </div>
            )}
            <div className="flex gap-2">
              {status !== 'CLOSED' ? (
                <button onClick={handleClose} disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--surface-3) text-(--text-tertiary) text-[10px] font-black uppercase tracking-wider hover:bg-(--surface-2) transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Close Ticket
                </button>
              ) : (
                <button onClick={handleReopen} disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-[10px] font-black uppercase tracking-wider hover:bg-(--accent)/20 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Reopen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SupportAdminClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [filter, setFilter] = useState<string | null>(null)
  const filtered = filter ? initialTickets.filter(t => t.status === filter) : initialTickets

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[null, 'OPEN', 'IN_PROGRESS', 'CLOSED'].map(f => (
          <button key={f ?? 'ALL'} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
              filter === f
                ? 'bg-(--purple) text-white'
                : 'bg-(--surface-2) text-(--text-tertiary) border border-(--border) hover:border-(--border-hover)'
            }`}>
            {f ?? 'All'} ({f ? initialTickets.filter(t => t.status === f).length : initialTickets.length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}
        {filtered.length === 0 && (
          <div className="py-16 text-center border border-dashed border-(--border) rounded-xl">
            <p className="text-sm text-(--text-tertiary)">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  )
}
