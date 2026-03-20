'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'

import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingHero from '@/components/landing/LandingHero'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingPricing from '@/components/landing/LandingPricing'
import LandingFooter from '@/components/landing/LandingFooter'
import LandingFAQ from '@/components/landing/LandingFAQ'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export default function LandingPage() {
  const { lang } = useParams()
  const [dict, setDict] = useState<any>(null)

  useEffect(() => {
    async function loadDictionary() {
      const dictionary = await getDictionary(lang as Locale)
      setDict(dictionary)
    }
    loadDictionary()
  }, [lang])

  if (!dict) return (
    <div className="min-h-screen bg-(--bg-base) flex items-center justify-center">
       <div className="w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="bg-(--bg-base) text-(--text-primary) min-h-screen font-sans selection:bg-(--accent) selection:text-(--text-inverse)">
      {/* Grid infrastructure */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />

      <LandingNavbar dict={dict} lang={lang as string} />
      
      <main className="relative">
        <LandingHero dict={dict} lang={lang as string} />
        <LandingFeatures />
        <LandingPricing dict={dict} lang={lang as string} />
        <LandingFAQ />
      </main>

      <LandingFooter lang={lang as string} />
    </div>
  )
}