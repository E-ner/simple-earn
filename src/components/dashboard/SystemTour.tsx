'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Zap, Wallet, PlayCircle, Trophy } from 'lucide-react'

interface TourStep {
  title: string
  content: string
  target: string // CSS Selector or descriptive ID
  icon: React.ReactNode
}

interface SystemTourProps {
  isOpen: boolean
  onClose: () => void
  dict: any
}

export default function SystemTour({ isOpen, onClose, dict }: SystemTourProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps: TourStep[] = [
    {
      title: dict?.tour?.welcome_title || 'Welcome to Simple Earn',
      content: dict?.tour?.welcome_desc || 'This tour will guide you through the main features of your decentralized earning dashboard.',
      target: 'header',
      icon: <Zap className="w-5 h-5 text-[var(--accent)]" />
    },
    {
      title: dict?.tour?.balances_title || 'Your Balances',
      content: dict?.tour?.balances_desc || 'Monitor your Main Balance (withdrawals) and Game Balance (for playing games) in real-time.',
      target: '#balance-cards',
      icon: <Wallet className="w-5 h-5 text-[var(--purple)]" />
    },
    {
      title: dict?.tour?.tasks_title || 'Daily Earning Tasks',
      content: dict?.tour?.tasks_desc || 'Complete quizzes and watch videos every day to maximize your yields and maintain your streak.',
      target: '#task-progress',
      icon: <PlayCircle className="w-5 h-5 text-[#ec4899]" />
    },
    {
      title: dict?.tour?.activity_title || 'Transparent Logging',
      content: dict?.tour?.activity_desc || 'Every micro-transaction is recorded on our transparent ledger for your review.',
      target: '#recent-activity',
      icon: <Trophy className="w-5 h-5 text-yellow-500" />
    }
  ]

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[32px] overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                {steps[currentStep].icon}
              </div>
              <div>
                <h4 className="text-[var(--text-primary)] font-bold">{steps[currentStep].title}</h4>
                <p className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-[var(--text-tertiary)] leading-relaxed">
              {steps[currentStep].content}
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-[var(--surface-3)]'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="h-10 px-6 rounded-full border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button 
                onClick={handleNext}
                className="h-10 px-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Continue'}
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
