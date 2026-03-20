'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'

export default function Sidebar({ userRole, isMobile, onLinkClick }: { userRole?: string, isMobile?: boolean, onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { lang } = useParams()
  const [dict, setDict] = useState<any>(null)

  useEffect(() => {
    async function loadDict() {
      const dictionary = await getDictionary(lang as Locale)
      setDict(dictionary)
    }
    loadDict()
  }, [lang])

  const links = [
    { name: dict?.common?.dashboard || 'Dashboard', href: `/${lang}/dashboard`, icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: dict?.common?.quizzes || 'Quizzes', href: `/${lang}/dashboard/quizzes`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: dict?.common?.videos || 'Videos', href: `/${lang}/dashboard/videos`, icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
    { name: dict?.common?.games || 'Token Games', href: `/${lang}/dashboard/games`, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: dict?.common?.wallet || 'Wallet', href: `/${lang}/dashboard/wallet`, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Audit Trail', href: `/${lang}/dashboard/transactions`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Institutional Alerts', href: `/${lang}/dashboard/notifications`, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Communication Channel', href: `/${lang}/dashboard/support`, icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
  ]

  if (userRole === 'ADMIN') {
    links.push({ name: 'Admin Panel', href: `/${lang}/admin`, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' })
  }

  return (
    <aside className={`${isMobile ? 'w-full' : 'w-[220px] hidden md:flex'} shrink-0 bg-(--bg-overlay) border-r border-(--border) flex-col relative z-20 h-full`}>
      <div className="p-6 flex items-center justify-between">
        <Link href={`/${lang}/dashboard` as any} onClick={onLinkClick} className="flex items-center gap-3 w-max">
          <div className="w-8 h-8 rounded bg-(--accent) flex items-center justify-center shrink-0">
            <span className="text-(--text-inverse) font-bold text-lg leading-none">S</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-(--text-primary)">
            Simple Earn
          </span>
        </Link>
        {isMobile && (
          <button onClick={onLinkClick} className="p-2 text-(--text-secondary)">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = link.href.endsWith('/dashboard') 
            ? pathname === link.href 
            : pathname === link.href || pathname?.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.name}
              href={link.href as any}
              onClick={onLinkClick}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-(--surface-2) p-4 rounded-md border border-(--border) relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-(--accent-muted) rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
          <h4 className="text-sm font-semibold text-(--text-primary)">Pro Tips</h4>
          <p className="text-xs text-(--text-secondary) mt-1.5 leading-relaxed">
            Log in daily to claim your daily streaks and bonus rewards.
          </p>
        </div>
      </div>
    </aside>
  )
}
