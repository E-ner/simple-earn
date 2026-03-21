'use client'

import { useState } from 'react'
import { Menu, X, ShieldCheck } from 'lucide-react'
import AdminSidebar from './AdminSidebar'

export default function AdminLayoutClient({ children, lang }: { children: React.ReactNode, lang: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-(--bg-base) overflow-hidden relative">
      {/* Sidebar - Desktop (Fixed) & Mobile (Drawer) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-(--bg-overlay) border-r border-(--border) transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar lang={lang} onClose={() => setIsOpen(false)} />
      </div>

      {/* Backdrop (Mobile only) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-(--bg-overlay) border-b border-(--border) px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-7 h-7 rounded bg-(--purple) flex items-center justify-center">
               <ShieldCheck className="w-4 h-4 text-white" />
             </div>
             <span className="text-xs font-black uppercase tracking-widest text-(--text-primary)">Admin Panel</span>
          </div>
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md hover:bg-(--surface) text-(--text-secondary) transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-(--bg-elevated) relative">
          {children}
        </main>
      </div>
    </div>
  )
}
