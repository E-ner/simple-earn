'use client'
import { useState, useTransition, useEffect } from 'react'
import { getTicketDetails, replyToTicket, closeTicket } from '@/app/actions/supportActions'
import { MessageSquare, CheckCircle, Send, Clock } from 'lucide-react'

export function SupportClient({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (selectedTicketId) {
      getTicketDetails(selectedTicketId).then(data => setActiveTicket(data))
    }
  }, [selectedTicketId, isPending])

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicketId) return
    startTransition(async () => {
      await replyToTicket(selectedTicketId, replyText)
      setReplyText('')
    })
  }

  const handleClose = () => {
    if (!selectedTicketId) return
    if (confirm('Mark this inquiry as resolved?')) {
      startTransition(async () => {
        await closeTicket(selectedTicketId)
        setActiveTicket({...activeTicket, status: 'CLOSED'})
        setTickets(tickets.map(t => t.id === selectedTicketId ? {...t, status: 'CLOSED'} : t))
      })
    }
  }

  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      {/* Ticket List */}
      <div className="w-1/3 bg-(--surface) border border-(--border) rounded-xl flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-(--border) bg-(--surface-2)">
          <h3 className="text-xs font-black text-(--text-tertiary) uppercase tracking-widest">Active Tickets ({tickets.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tickets.map(t => (
            <button key={t.id} onClick={() => setSelectedTicketId(t.id)} 
               className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTicketId === t.id ? 'bg-(--accent)/10 border border-(--accent)/30' : 'hover:bg-(--surface-2) border border-transparent'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[9px] font-black tracking-widest uppercase ${t.status === 'CLOSED' ? 'text-(--success)' : 'text-(--text-primary)'}`}>{t.status}</span>
                <span className="text-[9px] text-(--text-tertiary) font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-sm font-bold text-(--text-primary) truncate">{t.subject}</h4>
              <p className="text-[10px] text-(--text-secondary) mt-1">{t.user.email}</p>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-center p-8 text-(--text-tertiary) text-xs font-bold uppercase tracking-widest opacity-50">No Inquiries</p>}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="flex-1 bg-(--surface) border border-(--border) rounded-xl flex flex-col overflow-hidden">
        {activeTicket ? (
          <>
            <div className="p-6 border-b border-(--border) bg-(--surface-2) flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-(--text-primary)">{activeTicket.subject}</h2>
                <p className="text-xs text-(--text-tertiary) mt-1 flex items-center gap-2">
                  <span className="font-bold text-(--text-secondary)">{activeTicket.user.username}</span> • 
                  {activeTicket.user.email}
                </p>
              </div>
              {activeTicket.status !== 'CLOSED' && (
                <button onClick={handleClose} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-(--surface-3) border border-(--border) text-(--text-primary) rounded-lg text-xs font-bold hover:bg-(--success)/10 hover:text-(--success) hover:border-(--success)/30 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Resolve
                </button>
              )}
              {activeTicket.status === 'CLOSED' && (
                <span className="px-3 py-1 bg-(--success)/10 text-(--success) border border-(--success)/20 rounded text-[10px] font-black tracking-widest uppercase">Resolved</span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTicket.messages.map((m: any) => {
                const isAdmin = m.sender.role === 'ADMIN'
                return (
                  <div key={m.id} className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-(--text-tertiary) uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      {isAdmin ? 'Admin Support' : m.sender.username} • <Clock className="w-3 h-3"/> {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div className={`p-4 rounded-xl text-sm ${isAdmin ? 'bg-(--accent) text-white rounded-tr-none' : 'bg-(--surface-3) text-(--text-primary) border border-(--border) rounded-tl-none'}`}>
                      {m.message}
                    </div>
                  </div>
                )
              })}
            </div>

            {activeTicket.status !== 'CLOSED' && (
              <div className="p-4 bg-(--surface-2) border-t border-(--border) relative">
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full bg-(--surface-3) border border-(--border) text-(--text-primary) rounded-lg p-3 pr-12 text-sm focus:outline-none focus:border-(--accent) min-h-[80px]"
                />
                <button onClick={handleReply} disabled={!replyText.trim() || isPending} className="absolute right-6 bottom-6 p-2 bg-(--accent) text-white rounded-md hover:opacity-90 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <MessageSquare className="w-12 h-12 text-(--text-tertiary) mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-(--text-tertiary)">Select an inquiry to review</p>
          </div>
        )}
      </div>
    </div>
  )
}
