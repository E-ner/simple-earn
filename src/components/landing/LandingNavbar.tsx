'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface LandingNavbarProps {
  dict: any
  lang: string
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
]

export default function LandingNavbar({ dict, lang }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#lang-menu')) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const switchLanguage = (code: string) => {
    const newPath = pathname.replace(`/${lang}`, `/${code}`)
    router.push(newPath as any)
    setLangOpen(false)
  }

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      scrolled 
        ? 'py-3 border-b border-(--border) bg-(--bg-base)/80 backdrop-blur-md shadow-sm' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-(--accent) flex items-center justify-center">
            <span className="text-(--text-inverse) font-black text-sm">S</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-[11px] tracking-[0.2em] uppercase text-(--text-primary)">Simple Earn</span>
            <span className="text-[7px] font-bold text-(--text-tertiary) tracking-[0.3em] uppercase opacity-80">Protocol v2.0</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.3em]">
          <a href="#protocol" className="text-(--text-tertiary) hover:text-(--accent) transition-colors">
            The Protocol
          </a>
          <a href="#pricing" className="text-(--text-tertiary) hover:text-(--accent) transition-colors">
            Activation
          </a>
          <a href="#faq" className="text-(--text-tertiary) hover:text-(--accent) transition-colors">
            FAQ
          </a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Language Switcher */}
          <div className="relative" id="lang-menu">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--surface-2) border border-(--border) hover:border-(--border-hover) transition-all text-[9px] font-black uppercase tracking-widest text-(--text-tertiary) hover:text-(--text-primary)"
            >
              <Globe className="w-3 h-3 text-(--accent)" />
              <span>{currentLang.flag} {lang.toUpperCase()}</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-(--surface) border border-(--border) rounded-2xl shadow-xl p-2 z-[110]">
                <div className="text-[8px] font-black text-(--text-tertiary) uppercase tracking-widest px-3 py-2 border-b border-(--border)/50 mb-1">Select Identity</div>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-(--surface-2) transition-all text-xs gap-3"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm">{l.flag}</span>
                      <span className={`font-bold transition-colors ${l.code === lang ? 'text-(--accent)' : 'text-(--text-secondary)'}`}>{l.name}</span>
                    </span>
                    {l.code === lang && <div className="w-1.5 h-1.5 rounded-full bg-(--accent)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--surface-2) border border-(--border) hover:border-(--border-hover) transition-all text-(--text-tertiary) hover:text-(--accent)"
            aria-label="Toggle theme"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          <div className="h-6 w-px bg-(--border)/50 mx-1 hidden sm:block" />

          <Link
            href={`/${lang}/login`}
            className="text-[10px] font-black text-(--text-tertiary) hover:text-(--text-primary) uppercase tracking-widest transition-all px-4 py-2.5 rounded-xl hover:bg-(--surface-2) hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href={`/${lang}/register`}
            className="h-10 px-6 bg-(--accent) text-(--text-inverse) text-[10px] font-black rounded-full flex items-center uppercase tracking-[0.2em] transition-all hover:opacity-90"
          >
            <span className="relative z-10">Start Earning</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
