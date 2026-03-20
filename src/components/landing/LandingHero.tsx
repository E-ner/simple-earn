'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface LandingHeroProps {
  dict: any
  lang: string
}

const STATS = [
  { value: '$0.20', label: 'Per Verified Quiz' },
  { value: '$0.20', label: 'Per Training Module' },
  { value: '$5.00', label: 'Withdrawal Threshold' },
  { value: '100%', label: 'Human Verified' },
]

const TRUST_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face',
]

export default function LandingHero({ dict, lang }: LandingHeroProps) {
  return (
    <section className="relative pt-44 pb-20 md:pt-64 md:pb-40 z-10 overflow-hidden bg-(--bg-base)">
      {/* Static Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0 opacity-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Static Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-(--accent)/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-(--purple)/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <div>
          {/* Social proof — trust avatars */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {TRUST_AVATARS.map((src, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-(--bg-base) overflow-hidden relative">
                  <Image src={src} alt="user" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-(--accent) text-xs">★</span>
                ))}
              </div>
              <span className="text-[10px] text-(--text-tertiary) font-bold">Trusted by 2,400+ earners</span>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-(--border) bg-(--surface) mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
            <span className="text-[9px] font-black text-(--text-tertiary) tracking-[0.4em] uppercase">V2.0 Protocol Live — Network Active</span>
          </div>

          {/* H1 */}
          <h1 className="text-6xl md:text-[100px] font-black tracking-tighter mb-10 leading-[0.85] text-(--text-primary)">
            Earn Real Money.<br />
            <span className="text-(--accent)">
              Every Day.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-base md:text-lg text-(--text-secondary) mb-14 leading-relaxed font-medium">
            Simple Earn is a verified human attention protocol. Complete daily cognitive assessments and training modules — we reward your time with real, withdrawable income.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Link
              href={`/${lang}/register`}
              className="h-14 px-10 bg-(--accent) text-(--text-inverse) font-black text-xs rounded-full uppercase tracking-[0.25em] flex items-center justify-center hover:opacity-90 transition-all"
            >
              Start Earning Now <ArrowRight className="ml-3 w-4 h-4" />
            </Link>
            <a
              href="#protocol"
              className="h-14 px-10 border border-(--border) text-(--text-secondary) font-black text-xs rounded-full uppercase tracking-[0.25em] flex items-center justify-center hover:border-(--border-hover) hover:text-(--text-primary) transition-all"
            >
              How It Works
            </a>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center divide-x divide-(--border) border border-(--border) rounded-2xl bg-(--surface) overflow-hidden shadow-sm">
            {STATS.map((s, i) => (
              <div key={i} className="flex-1 min-w-[120px] px-6 py-5 text-center">
                <div className="text-2xl font-black text-(--text-primary) tracking-tighter font-mono">{s.value}</div>
                <div className="text-[9px] text-(--text-tertiary) uppercase tracking-widest font-black mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Static Dashboard preview image */}
      <div className="max-w-6xl mx-auto px-6 mt-20 relative">
        <div className="relative rounded-3xl overflow-hidden border border-(--border) bg-(--surface)">
          <Image
            src="/images/dashboard-new.png"
            alt="Simple Earn Dashboard Preview"
            width={1600}
            height={800}
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  )
}
