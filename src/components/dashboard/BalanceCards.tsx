'use client'

import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/currency'
import { Wallet, TrendingUp, Trophy } from 'lucide-react'

interface BalanceCardsProps {
  user: any
  currency: string
  dict: any
}

export default function BalanceCards({ user, currency, dict }: BalanceCardsProps) {
  const balances = [
    { 
      label: dict?.dashboard?.balances?.main || 'Main Balance', 
      amount: user.mainBalance, 
      color: 'from-(--accent) to-(--accent-muted)',
      icon: <Wallet className="w-5 h-5" />,
      badge: dict?.dashboard?.balances?.available || "Verified"
    },
    { 
      label: dict?.dashboard?.balances?.game || 'Game Balance', 
      amount: user.gameBalance, 
      color: 'from-(--purple) to-[#7c3aed]',
      icon: <TrendingUp className="w-5 h-5" />,
      badge: dict?.dashboard?.balances?.tokens || "Tokens"
    },
    { 
      label: dict?.dashboard?.balances?.total || 'Total Earned', 
      amount: user.totalEarned, 
      color: 'from-[#ec4899] to-[#db2777]',
      icon: <Trophy className="w-5 h-5" />,
      badge: dict?.dashboard?.balances?.lifetime || "Protocol Yield"
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {balances.map((card, i) => (
        <motion.div
          key={i}
          variants={item}
          className="relative group p-6 rounded-(--radius-xl) bg-(--surface) border border-(--border) hover:border-(--border-hover) transition-all overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`} />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-md bg-gradient-to-br ${card.color} bg-opacity-10 flex items-center justify-center text-(--text-primary)`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-(--text-tertiary) group-hover:text-(--accent) transition-colors">
                {card.badge}
              </span>
            </div>
            
            <div className="mt-auto">
              <p className="text-[10px] font-bold text-(--text-tertiary) uppercase tracking-widest mb-1.5">{card.label}</p>
              <div className="text-3xl font-bold text-(--text-primary) tracking-tighter">
                {formatCurrency(card.amount, currency)}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
