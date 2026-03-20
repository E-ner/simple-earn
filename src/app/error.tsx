'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-16 h-16 rounded-xl bg-(--error)/10 border border-(--error)/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-(--error)" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-(--error) font-mono">Runtime Error</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Something Went Wrong</h1>
          <p className="text-sm text-[#888] leading-relaxed">
            An unexpected error occurred. Our team has been notified and is working to fix it.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[#555] pt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-md bg-(--accent) text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-md border border-white/10 text-xs font-bold text-[#888] hover:text-white transition-colors"
          >
            Back Home
          </a>
        </div>
      </div>
    </div>
  )
}
