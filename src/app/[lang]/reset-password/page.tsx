'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { getDictionary, Locale } from '@/lib/dictionary'
import { resetPassword } from '@/app/actions/authActions'

function ResetPasswordForm() {
  const { lang } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [dict, setDict] = useState<any>(null)
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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
    if (!token) {
      setError('Invalid recovery parameters.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Key mismatch error: Passwords do not match.')
      return
    }
    if (formData.password.length < 6) {
      setError('Complexity Mismatch: Minimum 6 characters required.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await resetPassword(token, formData.password)
      if (result.success) {
        setIsSuccess(true)
      } else {
        setError(result.error || 'Identity update failed.')
      }
    } catch (err) {
      setError('Critical Protocol Error: Network mismatch.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!dict) return null

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 relative z-10 shadow-2xl"
      >
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
            {dict.auth.reset_password_title}
          </h1>
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-black tracking-widest">
            {dict.auth.reset_password_desc}
          </p>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-center space-y-6"
          >
            <CheckCircle2 className="w-10 h-10 text-[var(--accent)] mx-auto" />
            <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {dict.auth.password_reset_success}
            </p>
            <button 
              onClick={() => router.push(`/${lang}/login`)}
              className="w-full h-11 bg-[var(--text-primary)] text-[var(--bg-elevated)] text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
            >
              {dict.common.login}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{dict.auth.new_password}</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors pl-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{dict.auth.confirm_new_password}</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors pl-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
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
              className="w-full h-11 bg-[var(--text-primary)] text-[var(--bg-elevated)] text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : dict.auth.update_password}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
