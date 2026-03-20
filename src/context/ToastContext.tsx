'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'INFO') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="pointer-events-auto group relative flex items-center gap-3 p-4 bg-[#16161e] border border-white/[0.08] shadow-2xl rounded-md overflow-hidden"
            >
              {/* Progress bar */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[2px] ${
                  toast.type === 'SUCCESS' ? 'bg-green-500' :
                  toast.type === 'ERROR' ? 'bg-red-500' :
                  toast.type === 'WARNING' ? 'bg-yellow-500' : 'bg-[var(--accent)]'
                }`}
              />

              <div className={`p-2 rounded-sm shrink-0 ${
                toast.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                toast.type === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                toast.type === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'
              }`}>
                {toast.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4" />}
                {toast.type === 'ERROR' && <AlertCircle className="w-4 h-4" />}
                {toast.type === 'WARNING' && <AlertTriangle className="w-4 h-4" />}
                {toast.type === 'INFO' && <Info className="w-4 h-4" />}
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-[#888] flex-1 leading-relaxed">
                {toast.message}
              </p>

              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/5 rounded-sm transition-colors text-[#555] hover:text-[#888]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
