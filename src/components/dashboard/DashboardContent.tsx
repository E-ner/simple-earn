'use client'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { useParams } from 'next/navigation'
import BalanceCards from "@/components/dashboard/BalanceCards"
import TaskProgress from "@/components/dashboard/TaskProgress"
import RecentActivity from "@/components/dashboard/RecentActivity"
import { getCurrencyFromCountry } from "@/lib/currency"
import { getDictionary, Locale } from '@/lib/dictionary'
import SystemTour from "@/components/dashboard/SystemTour"
import EarningsChart from "@/components/dashboard/EarningsChart"

interface DashboardContentProps {
  user: any
  quizStats: any
  videoStats: any
  totalEarned: number
  transactions: any[]
  chartData: any[]
}

export default function DashboardContent({ 
  user, 
  quizStats, 
  videoStats, 
  totalEarned, 
  transactions,
  chartData
}: DashboardContentProps) {
  const [dict, setDict] = useState<any>(null)
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [displayMain, setDisplayMain] = useState(Number(user?.mainBalance || 0))
  const [displayGame, setDisplayGame] = useState(Number(user?.gameBalance || 0))
  const { lang } = useParams()

  useEffect(() => {
    // Simulate real-time yield (mining/passive income)
    const interval = setInterval(() => {
      if (user?.isActive) {
        setDisplayMain(prev => prev + (Math.random() * 0.00001))
        setDisplayGame(prev => prev + (Math.random() * 0.000005))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [user?.isActive])

  useEffect(() => {
    // Sync with props if they change (e.g. after a task/quiz)
    setDisplayMain(Number(user?.mainBalance || 0))
    setDisplayGame(Number(user?.gameBalance || 0))
  }, [user?.mainBalance, user?.gameBalance])

  useEffect(() => {
    async function loadDict() {
      try {
        const dictionary = await getDictionary(lang as Locale)
        setDict(dictionary)
      } catch (error) {
        console.error('Failed to load dashboard dictionary:', error)
      }
    }
    loadDict()
  }, [lang])

  const currency = getCurrencyFromCountry(user?.country || 'US')
  const [activeCurrency, setActiveCurrency] = useState(currency)

  if (!dict) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 rounded-md border-2 border-(--accent) border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">
            {dict?.common?.dashboard || 'Overview Terminal'}
          </h1>
          <p className="text-(--text-secondary) max-w-xl leading-relaxed">
            {dict?.dashboard?.strategy_desc || 'Access your decentralized earning nodes. Monitor your cognitive yield and protocol performance in real-time.'}
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-(--surface-2) border border-(--border) self-start md:self-auto">
          {['USD', 'RWF'].map((curr) => (
            <button
              key={curr}
              onClick={() => setActiveCurrency(curr)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCurrency === curr 
                  ? 'bg-(--accent) text-white shadow-lg' 
                  : 'text-(--text-tertiary) hover:text-(--text-primary)'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </header>

      <div id="balance-cards">
        <BalanceCards 
          user={{
            ...user,
            mainBalance: displayMain,
            gameBalance: displayGame,
            totalEarned: displayMain + displayGame
          }} 
          currency={activeCurrency} 
          dict={dict}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left Column: Stats & Strategy */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            className="p-8 rounded-(--radius-xl) bg-(--surface) border border-(--border) relative overflow-hidden group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-(--accent)/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-(--accent)/10 flex items-center justify-center">
                   <Zap className="w-5 h-5 text-(--accent)" />
                </div>
                <h3 className="text-lg font-bold text-(--text-primary)">{dict?.dashboard?.strategy_title || 'Your Earning Strategy for Today'}</h3>
              </div>
              <p className="text-sm text-(--text-secondary) leading-relaxed mb-8 max-w-xl">
                {dict?.dashboard?.strategy_desc || 'Complete your daily cognitive tasks to maintain your streak. Each verified quiz adds $0.20 to your balance. Watch high-yield videos to unlock passive rewards.'}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsTourOpen(true)}
                  className="h-10 px-6 rounded-md bg-(--text-primary) text-(--bg-elevated) text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  {dict?.dashboard?.quick_start || 'Quick Start Guide'}
                </button>
              </div>
            </div>
          </motion.div>

          <div id="task-progress">
            <TaskProgress 
              quizStats={quizStats}
              videoStats={videoStats}
              dict={dict}
              lang={lang as string}
            />
          </div>

          <div id="earnings-chart">
            <EarningsChart data={chartData} dict={dict} currency={activeCurrency} />
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-1" id="recent-activity">
          <RecentActivity 
            transactions={transactions} 
            currency={activeCurrency}
            dict={dict}
          />
        </div>
      </div>

      <SystemTour 
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        dict={dict}
      />
    </div>
  )
}
