'use client'

import { signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Bell, LogOut, User as UserIcon, ChevronDown, Check, Settings } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter, usePathname } from 'next/navigation'

interface HeaderProps {
  user: any
  onMenuClick?: () => void
}

import { getNotifications, markAllNotificationsAsRead } from "@/app/actions/notificationActions"
import { getDictionary, Locale } from "@/lib/dictionary"
import ThemeToggle from "./ThemeToggle"

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications ] = useState<any[]>([])
  const [dict, setDict] = useState<any>(null)
  const { lang } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ]

  useEffect(() => {
    async function loadResources() {
      try {
        const [notifs, dictionary] = await Promise.all([
          getNotifications(),
          getDictionary(lang as Locale)
        ])
        setNotifications(notifs)
        setDict(dictionary)
      } catch (error) {
        console.error('Failed to load header resources:', error)
      }
    }
    loadResources()
  }, [lang])

  const toggleLanguage = (code: string) => {
    const newPath = pathname.replace(`/${lang}`, `/${code}`)
    router.push(newPath as any)
    setIsLangOpen(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <header className="h-16 shrink-0 bg-[var(--bg-elevated)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 md:px-8 flex items-center justify-between relative z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[150px] sm:max-w-none">
            {dict?.common?.welcome || 'Welcome'}, {user?.username || 'Learner'}
          </h2>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest hidden sm:block">
              {user?.role === 'ADMIN' ? 'Root Administrator' : 'Verified Protocol Node'}
            </p>
            {user?.isActive && (
              <div className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse hidden sm:block" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{lang}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isLangOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-2xl p-1.5 overflow-hidden z-[60]"
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => toggleLanguage(l.code)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--surface-2)] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span>{l.flag}</span>
                      <span className={lang === l.code ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-tertiary)]'}>{l.name}</span>
                    </div>
                    {lang === l.code && <Check className="w-3 h-3 text-[var(--accent)]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent)] rounded-sm border-2 border-[var(--bg-elevated)]" />
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-2xl overflow-hidden z-[60]"
              >
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{dict?.common?.notifications || 'Notifications'}</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-[var(--accent)] hover:underline"
                    >
                      {dict?.common?.markAllRead || 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-md mb-1 transition-colors ${n.isRead ? 'hover:bg-[var(--surface-2)]' : 'bg-[var(--surface-2)]'}`}>
                      <p className={`text-xs font-medium ${n.isRead ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>{n.title}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">
                      No notifications
                    </div>
                  )}
                </div>
                <Link 
                  href={`/${lang}/dashboard/notifications`}
                  onClick={() => setIsNotifOpen(false)}
                  className="w-full block py-3 text-center text-[10px] font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border-t border-[var(--border)] transition-colors"
                >
                  VIEW ALL SYSTEM LOGS
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-6 w-[1px] bg-[var(--border)] hidden sm:block" />

        <div className="flex items-center gap-3">
          <Link 
            href={`/${lang}/dashboard/profile`}
            className="p-2 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] transition-colors"
          >
            <UserIcon className="w-4 h-4" />
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: `/${lang}/login` as any })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{dict?.common?.logout || 'Logout'}</span>
          </button>
          
          <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-[var(--accent)] to-[var(--purple)] p-[1.5px] hidden sm:block">
            <div className="w-full h-full bg-[var(--bg-elevated)] rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-[var(--text-primary)]">
                {user?.username?.substring(0,2).toUpperCase() || 'US'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
