'use client'

import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-(--accent)" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-(--accent) font-mono">Error 404</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Page Not Found</h1>
          <p className="text-sm text-[#888] leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved to a new location.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/en/dashboard"
            className="px-5 py-2.5 rounded-md bg-(--accent) text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-md border border-white/10 text-xs font-bold text-[#888] hover:text-white transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  )
}
