'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { getDictionary, Locale } from '@/lib/dictionary'
import { requestPasswordReset } from '@/app/actions/authActions'

export default function ForgotPasswordPage() {
  const { lang } = useParams()
  const router = useRouter()
  const [dict, setDict] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDict() {
      const d = await getDictionary(lang as Locale)
      setDict(d)
    }
    loadDict()
  }, [lang])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setIsSent(true)
      } else {
        setError(result.error || 'Failed to request reset')
      }
    } catch (err) {
      setError('An unexpected network error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!dict) return null

  return (
    <div className="min-h-screen bg-(--bg-base) flex items-center justify-center p-6">
      {/* Background Infrastructure */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-(--surface) border border-(--border) rounded-2xl p-10 relative z-10 shadow-2xl"
      >
        <div className="mb-10 text-center lg:text-left">
          <Link href={`/${lang}/login`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-(--accent) mb-6 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-3 h-3" />
            {dict.auth.back_to_login}
          </Link>
          <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight mb-3">
            {dict.auth.forgot_password_title}
          </h1>
          <p className="text-[10px] text-(--text-tertiary) uppercase font-black tracking-widest leading-relaxed">
            {dict.auth.forgot_password_desc}
          </p>
        </div>

        {isSent ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-(--accent)/5 border border-(--accent)/20 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-(--accent)/10 flex items-center justify-center mx-auto text-(--accent)">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-(--text-primary) leading-relaxed">
              {dict.auth.reset_email_sent}
            </p>
            <button 
              onClick={() => router.push(`/${lang}/login`)}
              className="w-full h-11 bg-(--text-primary) text-(--bg-elevated) text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
            >
              {dict.auth.back_to_login}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-(--text-tertiary)">Verified Communication Channel (Email)</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-(--surface-2) border border-(--border) rounded-md px-4 text-sm text-(--text-primary) focus:border-(--accent) outline-none transition-colors pl-10"
                  placeholder="name@institutional.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-center">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-(--text-primary) text-(--bg-elevated) text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : dict.auth.send_reset_link}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
