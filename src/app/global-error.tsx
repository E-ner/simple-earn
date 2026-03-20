'use client'

import { ShieldAlert } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-[#06060a] text-[#f0f0f5] antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 font-mono">Critical Error</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Application Failure</h1>
              <p className="text-sm text-[#888] leading-relaxed">
                A critical error has occurred and the application could not recover. Please try refreshing the page.
              </p>
              {error.digest && (
                <p className="text-[10px] font-mono text-[#555] pt-1">
                  Reference: {error.digest}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
              >
                Reload Application
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-md border border-white/10 text-xs font-bold text-[#888] hover:text-white transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
