'use client'

import { motion } from 'framer-motion'
import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-20 flex flex-col items-center justify-center text-center border border-dashed border-(--border) rounded-md bg-(--surface-2)"
    >
      <div className="w-16 h-16 rounded-md bg-(--surface-3) border border-(--border) flex items-center justify-center mb-6">
        <Icon className="w-6 h-6 text-(--text-tertiary)" />
      </div>
      <h3 className="text-[10px] font-black text-(--text-primary) uppercase tracking-[0.3em] mb-3">
        {title}
      </h3>
      <p className="text-[11px] text-(--text-tertiary) max-w-[280px] leading-relaxed uppercase font-bold tracking-widest italic mb-8">
        {description}
      </p>
      {action && (
        <button 
          onClick={action.onClick}
          className="h-10 px-8 rounded-md bg-(--text-primary) text-(--bg-main) text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
