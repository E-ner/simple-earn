'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import { getNotifications, markAllNotificationsAsRead } from '@/app/actions/notificationActions'
import { Bell, CheckCheck, Trash2, Calendar, Shield } from 'lucide-react'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const { lang } = useParams()
  const [dict, setDict] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [dictionary, notifs] = await Promise.all([
        getDictionary(lang as Locale),
        getNotifications()
      ])
      setDict(dictionary)
      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [lang])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all read:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-(--accent) border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">
            {dict?.common?.notifications || 'Institutional Alerts'}
          </h1>
          <p className="text-[#888] max-w-2xl leading-relaxed uppercase font-black text-[10px] tracking-widest italic">
            Security logs and protocol engagement alerts directed to your authorized node.
          </p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-(--surface-2) border border-(--border) text-[10px] font-black uppercase tracking-widest text-(--accent) hover:bg-(--accent)/10 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Validate All Logs
          </button>
        )}
      </header>

      <div className="space-y-4">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`group p-6 rounded-md border transition-all flex gap-6 ${
              notif.isRead 
                ? 'bg-(--surface) border-(--border) opacity-60' 
                : 'bg-(--surface-2) border-(--border)'
            }`}
          >
            <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${
              notif.type === 'TRANSACTION' ? 'bg-green-500/10 text-green-500' :
              notif.type === 'SECURITY' ? 'bg-red-500/10 text-red-500' :
              'bg-(--accent)/10 text-(--accent)'
            }`}>
              {notif.type === 'SECURITY' ? <Shield className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className={`text-[11px] font-black uppercase tracking-widest ${notif.isRead ? 'text-(--text-secondary)' : 'text-(--text-primary)'}`}>
                  {notif.title}
                </h3>
                <span className="text-[9px] text-[#444] font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(notif.createdAt), 'dd MMM, HH:mm')}
                </span>
              </div>
              <p className="text-[10px] text-[#555] leading-relaxed max-w-3xl">
                {notif.message}
              </p>
            </div>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="py-24 border border-dashed border-(--border) rounded-md bg-(--surface) flex flex-col items-center justify-center text-center">
            <Bell className="w-10 h-10 text-(--text-tertiary) mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Communication Channel Clear</p>
          </div>
        )}
      </div>
    </div>
  )
}
