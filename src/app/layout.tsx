import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Plus_Jakarta_Sans, Manrope } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Simple Earn — Earn Real Money Daily',
  description: 'Complete quizzes, watch videos, and play token games to earn real money every day.',
}

import { RootProviders } from '@/components/providers/RootProviders'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${inter.variable} ${jakarta.variable} ${manrope.variable}`}>
      <body className="antialiased font-sans font-learn text-(--text-primary) bg-(--bg-base)">
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}

