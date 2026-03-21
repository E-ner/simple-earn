'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, CreditCard, BookOpen,
  Gamepad2, Banknote, MessageSquare, LogOut, ShieldCheck, X
} from 'lucide-react'
import ThemeToggle from '@/components/dashboard/ThemeToggle'

const NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: 'admin' },
  { label: 'Users', icon: Users, path: 'admin/users' },
  { label: 'Transactions', icon: CreditCard, path: 'admin/transactions' },
  { label: 'Daily Schedule', icon: BookOpen, path: 'admin/content' },
  { label: 'Quizzes', icon: BookOpen, path: 'admin/content/quizzes' },
  { label: 'Videos', icon: BookOpen, path: 'admin/content/videos' },
  { label: 'Games', icon: Gamepad2, path: 'admin/games' },
  { label: 'Support', icon: MessageSquare, path: 'admin/support' },
  { label: 'Profile', icon: ShieldCheck, path: 'admin/profile' },
]

export default function AdminSidebar({ lang, onClose }: { lang: string, onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="w-full h-full bg-(--bg-overlay) flex flex-col">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-(--border) flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-(--purple) flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-(--text-primary)">Admin Panel</p>
            <p className="text-[9px] text-(--text-tertiary) uppercase tracking-widest">Root Access</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-(--surface) text-(--text-tertiary) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, path }) => {
          const href = `/${lang}/${path}`
          const isExact = path === 'admin' || path === 'admin/content'
          const isActive = isExact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={path}
              href={href as any}
              className={`flex items-center gap-2.5 px-3 py-2.5 mx-2 my-0.5 text-sm font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-(--surface) text-(--purple)'
                  : 'text-(--text-tertiary) hover:bg-(--surface) hover:text-(--text-primary)'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-(--border) space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-(--text-tertiary)">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: `/${lang}/login` as any })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest text-(--text-tertiary) hover:text-(--error) hover:bg-(--error)/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
