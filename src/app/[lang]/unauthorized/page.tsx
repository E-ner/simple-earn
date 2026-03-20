'use client'

import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-16 h-16 rounded-xl bg-(--gold-muted) border border-(--gold)/20 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-(--gold)" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-(--gold) font-mono">Error 403</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-[#888] leading-relaxed">
            You don&apos;t have permission to access this page. Please sign in with an authorized account or contact support.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/en/login"
            className="px-5 py-2.5 rounded-md bg-(--accent) text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Sign In
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
