'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const FAQ_DATA = [
  {
    q: 'What exactly is Simple Earn?',
    a: 'Simple Earn is a verified human attention protocol. We partner with institutions and content networks to fund daily quizzes and video training modules. You complete them, we verify your engagement, and you earn real, withdrawable income.'
  },
  {
    q: 'How does the $1.00 node activation fee work?',
    a: 'The one-time $1.00 fee initializes your earning node on our network — this is a human verification mechanism that separates automated bots from real users. After activation, your node is permanently verified and you gain full access to all earning features and withdrawals. This is never charged again.'
  },
  {
    q: 'How much can I realistically earn per day?',
    a: 'Each completed quiz pays $0.20 and each video module pays $0.20. The exact number of daily tasks depends on the daily schedule published by the system. Most active users earn between $0.40 and $2.00 per day through consistent participation.'
  },
  {
    q: 'When and how can I withdraw my earnings?',
    a: 'Once your verified main balance reaches $5.00, you can initiate a withdrawal request. We support Mobile Money, Bank Transfer, and Crypto wallets. Withdrawal requests are processed and approved manually by our admin team, typically within 24 hours.'
  },
  {
    q: 'What are the Token Strategy Games?',
    a: 'The Token Games are optional probability-based games that use your gaming balance (separate from your main earning balance). You can deposit game tokens from your main balance and pick a winning token. Winnings are added to your game balance and can be transferred back.'
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We use industry-standard authentication (bcrypt for passwords, secure session tokens) and never share your data with third parties outside of our content partners.'
  },
]

export default function LandingFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section id="faq" className="py-40 relative border-y border-(--border) overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-(--accent)/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-(--purple)/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black text-(--accent) tracking-[0.5em] uppercase mb-4 block"
          >
            Knowledge Base
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-(--text-primary) tracking-tighter"
          >
            Common Questions
          </motion.h2>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                openFaq === i 
                  ? 'border-(--accent) bg-(--surface-2) shadow-[0_0_40px_rgba(var(--accent-rgb),0.1)]' 
                  : 'border-(--border) bg-(--surface) hover:border-(--border-hover)'
              }`}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-8 py-7 flex items-center justify-between text-left gap-4"
              >
                <span className={`text-sm font-bold transition-colors ${openFaq === i ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
                  {faq.q}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${openFaq === i ? 'bg-(--accent) rotate-180' : 'bg-(--border)'}`}>
                  {openFaq === i
                    ? <Minus className="w-3 h-3 text-white" />
                    : <Plus className="w-3 h-3 text-(--text-tertiary)" />
                  }
                </div>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 text-sm text-(--text-secondary) leading-relaxed border-t border-(--border)/50 pt-5">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
