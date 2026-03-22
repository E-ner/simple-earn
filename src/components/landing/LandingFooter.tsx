'use client'

import React from 'react'
import Link from 'next/link'

interface LandingFooterProps {
  lang?: string
}

export default function LandingFooter({ lang = 'en' }: LandingFooterProps) {
  return (
    <footer className="py-24 border-t border-(--border) bg-(--bg-base) relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-(--accent)/5 blur-[100px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          {/* Brand */}
          <div className="max-w-xs transition-opacity opacity-90">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-(--accent) flex items-center justify-center">
                <span className="text-(--text-inverse) font-black text-sm">S</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-[11px] tracking-[0.2em] uppercase text-(--text-primary)">Simple Earn</span>
                <span className="text-[7px] font-bold text-(--text-tertiary) tracking-[0.3em] uppercase opacity-80">Protocol v2.0</span>
              </div>
            </Link>
            <p className="text-xs text-(--text-tertiary) leading-relaxed font-medium">
              A human attention protocol that rewards verified cognitive work with real, withdrawable income. Built for the era of intelligent participation.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-20 gap-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-(--text-primary) mb-6">Platform</p>
              <div className="space-y-4">
                <a href="#protocol" className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">The Protocol</a>
                <a href="#pricing" className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">Activation Fee</a>
                <a href="#faq" className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">FAQ</a>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-(--text-primary) mb-6">Account</p>
              <div className="space-y-4">
                <Link href={`/${lang}/register`} className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">Initialize Node</Link>
                <Link href={`/${lang}/login`} className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">Sign In</Link>
                <Link href={`/${lang}/forgot-password`} className="block text-xs text-(--text-tertiary) hover:text-(--accent) transition-all">Credential Recovery</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 border-t border-(--border)/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-(--text-tertiary) opacity-60">
              &copy; 2026 Simple Earn Platform
            </span>
            <div className="w-1 h-1 rounded-full bg-(--border)" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-(--accent) font-black">
              Verified Humanity
            </span>
          </div>
          <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-(--text-tertiary)">
            <span className="hover:text-(--text-primary) cursor-pointer transition-colors relative">
              Network Status
              <div className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="hover:text-(--text-primary) cursor-pointer transition-colors">Terms of Protocol</span>
            <span className="hover:text-(--text-primary) cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
