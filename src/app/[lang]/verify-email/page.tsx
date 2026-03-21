'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { resendVerificationEmail } from '@/app/actions/authActions'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => router.push('/en/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend the code.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await resendVerificationEmail(email)
      if (!result.success) throw new Error(result.error || 'Failed to resend')
      setSuccess('Verification code resent! Please check your inbox.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-base) flex flex-col items-center justify-center p-6 sm:p-12 font-learn">
      <div className="w-full max-w-md bg-(--surface) border border-(--border) rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-(--accent)/10 flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-(--accent)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-(--text-primary)">Verify your email</h2>
          <p className="mt-2 text-(--text-secondary)">Enter the 6-digit code sent to your inbox</p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-sm">
            <p className="text-sm text-(--error) text-center font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 mb-6 bg-green-500/10 border border-green-500/20 rounded-sm">
            <p className="text-sm text-(--success) text-center font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {!searchParams.get('email') && (
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Email Address</label>
              <input 
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hello@example.com" className="input" required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <input 
              type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000" maxLength={6} 
              className="input text-center text-4xl tracking-widest font-mono h-20" 
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full btn-lg"
            disabled={isSubmitting || otp.length !== 6}
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-(--border) text-center space-y-4">
          <p className="text-sm text-(--text-tertiary)">
            Didn't receive the code?
          </p>
          <button 
            onClick={handleResend}
            disabled={isSubmitting}
            className="text-sm font-bold text-(--accent) hover:text-(--accent-hover) transition-colors"
          >
            Resend Verification Email
          </button>
          
          <div className="pt-4">
             <Link href="/en/login" className="text-xs text-(--text-tertiary) hover:text-(--text-primary)">
                Back to Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
