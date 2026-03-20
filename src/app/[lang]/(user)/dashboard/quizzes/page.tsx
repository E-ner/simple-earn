'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import EmptyState from '@/components/dashboard/EmptyState'
import { Brain } from 'lucide-react'

type Quiz = {
  id: string
  title: string
  description: string
  reward: number
  timeLimit: number
  isCompletedToday: boolean
}

export default function QuizzesPage() {
  const { lang } = useParams()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (data.quizzes) setQuizzes(data.quizzes)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--accent)" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title mb-2">Daily Quizzes</h1>
        <p className="text-(--text-secondary)">Test your knowledge and earn rewards. New quizzes available daily.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-md border bg-(--surface-2) border-(--border) flex flex-col ${quiz.isCompletedToday ? 'opacity-60 cursor-not-allowed' : 'hover:border-(--accent)/30 transition-all'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-md bg-(--surface-3) border border-(--border) flex items-center justify-center text-lg">
                <Brain className="w-5 h-5 text-(--accent)" />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-sm bg-(--success)/10 text-(--success) border border-(--success)/20">+$ {Number(quiz.reward).toFixed(2)}</span>
            </div>
            
            <h3 className="font-display font-bold text-xl text-(--text-primary) mb-2 mt-auto">
              {quiz.title}
            </h3>
            <p className="text-sm text-(--text-secondary) mb-6 line-clamp-2">
              {quiz.description}
            </p>

            {quiz.isCompletedToday ? (
              <button disabled className="h-10 rounded-md bg-(--surface-3) text-(--text-tertiary) text-[10px] font-black uppercase tracking-widest border border-(--border) cursor-not-allowed">
                Validated
              </button>
            ) : (
              <Link href={`/${lang}/dashboard/quizzes/${quiz.id}`} className="h-10 rounded-md bg-(--text-primary) text-(--bg-base) text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center">
                Initialize Analysis
              </Link>
            )}
          </motion.div>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              icon={Brain}
              title="Daily Protocols Dormant"
              description="No cognitive analysis tasks are currently scheduled for your node. Check the network status tomorrow."
            />
          </div>
        )}
      </div>
    </div>
  )
}
