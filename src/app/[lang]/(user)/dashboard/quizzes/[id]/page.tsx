'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'

type Question = {
  id: string
  question: string
  options: string[]
  order: number
}

type Quiz = {
  id: string
  title: string
  reward: number
  timeLimit: number
  questions: Question[]
}

export default function QuizPlayerPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as string
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10) // default fallback
  const [answers, setAnswers] = useState<{questionId: string, selectedIndex: number}[]>([])
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'PLAYING' | 'SUBMITTING' | 'FINISHED'>('LOADING')
  const [result, setResult] = useState<{passed: boolean, earnedAmount: number, score: number, total: number} | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch('/api/quizzes')
        const data = await res.json()
        const found = data.quizzes?.find((q: Quiz) => q.id === quizId)
        if (found) {
          setQuiz(found)
          setTimeLeft(found.timeLimit)
          setStatus('READY')
        } else {
          router.push(`/${lang}/dashboard/quizzes`)
        }
      } catch (error) {
        console.error('Failed to load quiz:', error)
      }
    }
    loadQuiz()
  }, [quizId, router, lang])

  // Timer logic
  useEffect(() => {
    let timerId: any
    if (status === 'PLAYING' && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(t => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && status === 'PLAYING') {
      handleNextOrSubmit() 
    }
    return () => clearInterval(timerId)
  }, [timeLeft, status])

  const startGame = () => {
    // Optional: Check activation here or in parent
    setStatus('PLAYING')
  }

  const selectAnswer = (index: number) => {
    if (status !== 'PLAYING') return

    setAnswers(prev => [
      ...prev, 
      { questionId: quiz!.questions[currentQIndex].id, selectedIndex: index }
    ])

    handleNextOrSubmit()
  }

  const handleNextOrSubmit = () => {
    if (!quiz) return

    if (currentQIndex < quiz.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1)
      setTimeLeft(quiz.timeLimit)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    setStatus('SUBMITTING')
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      const data = await res.json()
      setResult(data)
      setStatus('FINISHED')
    } catch {
      showToast("Error submitting quiz", "ERROR")
      setStatus('FINISHED')
    }
  }

  if (status === 'LOADING') return <div className="fixed inset-0 bg-black" />

  if (status === 'READY') {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg-base)] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-[var(--surface-2)] rounded-2xl flex items-center justify-center text-4xl mb-6">🎯</div>
          <h2 className="text-2xl font-bold font-display mb-2">{quiz?.title}</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            {quiz?.questions.length} questions • 10s per question
          </p>
          <button onClick={startGame} className="btn btn-primary w-full btn-lg">Start Now</button>
          <button onClick={() => router.back()} className="btn btn-ghost w-full mt-3">Cancel</button>
        </motion.div>
      </div>
    )
  }

  if (status === 'FINISHED' && result) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${result.passed ? 'bg-[#002b17]' : 'bg-[var(--bg-base)]'}`}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card max-w-md w-full p-8 text-center bg-[var(--bg-elevated)]">
          <div className="text-6xl mb-6">{result.passed ? '🎉' : '❌'}</div>
          <h2 className="text-3xl font-bold font-display mb-2">
            {result.passed ? 'Quiz Passed!' : 'Quiz Failed'}
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            You scored {result.score}/{result.total}
          </p>
          {result.passed && (
            <div className="bg-[var(--accent-muted)] text-[var(--accent)] font-mono text-xl py-4 rounded-md mb-8 border border-[var(--accent-border)]">
              +${Number(result.earnedAmount).toFixed(2)} Earned
            </div>
          )}
          <Link href="/en/dashboard/quizzes" className="btn btn-primary w-full">
            Back to Quizzes
          </Link>
        </motion.div>
      </div>
    )
  }

  const currentQ = quiz!.questions[currentQIndex]
  const pctTime = (timeLeft / quiz!.timeLimit) * 100

  return (
    <div className="fixed inset-0 z-50 bg-[#030305] flex flex-col sm:p-6 md:p-12 overflow-hidden">
      {/* Timer Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a1a24]">
        <motion.div 
          className="h-full"
          style={{ width: `${pctTime}%`, backgroundColor: pctTime < 30 ? 'var(--error)' : 'var(--accent)' }}
          animate={{ width: `${pctTime}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto p-6 pt-16">
        <div className="w-full mb-8 flex justify-between items-center text-[var(--text-tertiary)] font-mono text-sm px-2">
          <span>Question {currentQIndex + 1} of {quiz?.questions.length}</span>
          <span className={timeLeft <= 3 ? "text-[var(--error)] animate-pulse font-bold" : ""}>
            0:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h2 className="text-2xl sm:text-3xl font-ui font-medium text-[var(--text-primary)] mb-10 text-center leading-snug">
              {currentQ.question}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className="p-5 text-left rounded-md bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-3)] transition-all font-learn text-base text-[var(--text-primary)] shadow-sm group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[var(--accent-muted)] scale-0 group-hover:scale-100 transition-transform origin-center opacity-10 rounded-md" />
                  <span className="font-mono text-[var(--text-tertiary)] mr-3 opacity-50 text-xs">{(i+1).toString().padStart(2, '0')}</span>
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
