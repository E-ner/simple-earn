'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface LandingPricingProps {
  dict: any
  lang: string
}

const INCLUSIONS = [
  'Daily quiz access — $0.20 per assessment',
  'Video training modules — $0.20 per watch',
  'Token strategy games access',
  'Mobile Money, Bank & Crypto withdrawals',
  'Real-time earnings ledger',
  'Priority support ticket system',
  'Lifetime node status — no renewals',
]

export default function LandingPricing({ lang }: LandingPricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-32 relative overflow-hidden bg-(--bg-base)">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-(--accent)/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-lg mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black text-(--accent) tracking-[0.5em] uppercase mb-3 block">Node Initialization</span>
          <h2 className="text-3xl md:text-4xl font-black text-(--text-primary) tracking-tighter">
            One fee. Lifetime access.
          </h2>
        </div>

        <div className="p-10 border border-(--border) bg-(--surface) rounded-3xl relative overflow-hidden shadow-sm">
          {/* Price row */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-(--border)/50">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-(--text-primary) tracking-tighter leading-none">
                  $1
                </span>
                <span className="text-sm text-(--text-tertiary) font-bold">.00 USD</span>
              </div>
              <p className="text-[9px] font-black text-(--accent) uppercase tracking-widest mt-2 bg-(--accent)/5 inline-block px-2 py-0.5 rounded-sm">One-time · Lifetime</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--surface-2) border border-(--border)">
                <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
                <span className="text-[9px] font-black text-(--text-tertiary) uppercase tracking-wider">Protocol Active</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-(--text-secondary) mb-8 leading-relaxed">
            The $1.00 activation fee proves you&apos;re human and permanently unlocks your earning node — quizzes, videos, games, and withdrawals. No recurring charges, ever.
          </p>

          {/* Inclusions */}
          <ul className="space-y-3.5 mb-10">
            {INCLUSIONS.map((item, i) => (
              <li 
                key={i} 
                className="flex items-center gap-3 text-xs text-(--text-secondary)"
              >
                <div className="w-5 h-5 rounded-full bg-(--accent)/10 border border-(--accent)/20 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-(--accent)" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/${lang}/register`}
            className="h-14 w-full bg-(--accent) text-(--text-inverse) font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center rounded-2xl hover:opacity-90 transition-all"
          >
            Initialize My Node — $1.00
          </Link>

          <div className="flex items-center justify-center gap-4 mt-6">
            <p className="text-[10px] text-(--text-tertiary) uppercase tracking-wider font-bold">Free to register</p>
            <div className="w-1 h-1 rounded-full bg-(--border)" />
            <p className="text-[10px] text-(--text-tertiary) uppercase tracking-wider font-bold">Secure Checkout</p>
          </div>
        </div>
      </div>
    </section>
  )
}
