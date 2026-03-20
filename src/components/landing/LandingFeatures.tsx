'use client'

import React from 'react'
import { Brain, PlayCircle, Swords, Wallet, ShieldCheck, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: Brain,
    color: 'var(--accent)',
    title: 'Daily Cognitive Assessments',
    desc: 'Complete verified quizzes each day. Our proprietary algorithms ensure authentic human engagement. Each passed assessment adds $0.20 to your verified balance.',
  },
  {
    icon: PlayCircle,
    color: 'var(--purple)',
    title: 'High-Yield Training Modules',
    desc: 'Watch curated institutional video content from our partner network. Your attention is measured, verified, and rewarded with $0.20 per completed module.',
  },
  {
    icon: Swords,
    color: 'var(--gold)',
    title: 'Token Strategy Games',
    desc: 'Participate in decentralized probability games using your earned game tokens. Select winning tokens and multiply your gaming balance.',
  },
  {
    icon: Wallet,
    color: 'var(--accent)',
    title: 'Instant Capital Withdrawal',
    desc: 'Once your verified balance exceeds $5.00, you can initiate a withdrawal to Mobile Money, Bank, or Crypto in under 24 hours. No hidden fees.',
  },
  {
    icon: ShieldCheck,
    color: 'var(--purple)',
    title: 'One-Time Node Activation',
    desc: 'A single $1.00 protocol fee initializes your earning node, proving human identity and unlocking full withdrawal capabilities for life.',
  },
  {
    icon: BarChart3,
    color: 'var(--gold)',
    title: 'Transparent Earnings Ledger',
    desc: 'Every micro-transaction — every quiz reward, every video yield — is recorded on your personal ledger in real time. Full visibility, zero opacity.',
  },
]

export default function LandingFeatures() {
  return (
    <section id="protocol" className="py-32 relative border-t border-(--border) overflow-hidden bg-(--bg-base)">
      {/* Static Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-(--accent)/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <span className="text-[10px] font-black text-(--accent) tracking-[0.5em] uppercase mb-4 block">The Protocol</span>
          <h2 className="text-4xl md:text-5xl font-black text-(--text-primary) tracking-tighter mb-4">
            Six Ways to Earn.
          </h2>
          <p className="text-sm text-(--text-secondary) max-w-md mx-auto opacity-70">
            Every feature is designed to reward your time and cognitive engagement with verified, withdrawable income.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-(--border) rounded-3xl overflow-hidden border border-(--border) shadow-sm">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="relative p-10 bg-(--bg-base) hover:bg-(--surface) transition-colors group cursor-default"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-8 shadow-sm"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${feature.color} 10%, transparent)`, 
                  border: `1px solid color-mix(in srgb, ${feature.color} 20%, transparent)` 
                }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              
              <h3 className="text-[11px] font-black text-(--text-primary) mb-4 uppercase tracking-[0.25em]">
                {feature.title}
              </h3>
              <p className="text-xs text-(--text-secondary) leading-[1.8] opacity-70">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
