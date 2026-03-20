'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface TaskProgressProps {
  quizStats: {
    completed: number
    total: number
    pendingReward: number
  }
  videoStats: {
    watched: number
    total: number
    maxReward: number
  }
  dict: any
  lang: string
}

export default function TaskProgress({ quizStats, videoStats, dict, lang }: TaskProgressProps) {
  const quizPct = quizStats.total > 0 ? (quizStats.completed / quizStats.total) * 100 : 0
  const videoPct = videoStats.total > 0 ? (videoStats.watched / videoStats.total) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="section-label mb-1">{dict?.common?.quizzes || 'Daily Quizzes'}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-[var(--text-primary)]">
                {quizStats.completed} / {quizStats.total}
              </span>
              <span className="text-sm text-[var(--text-secondary)] font-learn">
                {dict?.dashboard?.completed || 'completed'}
              </span>
            </div>
          </div>
          <span className="badge badge-pending">+${quizStats.pendingReward.toFixed(2)} {dict?.dashboard?.pending_audit || 'audit pending'}</span>
        </div>
        
        <div className="progress-track mb-5">
          <div className="progress-fill" style={{ width: `${quizPct}%` }} />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] italic">
            {quizStats.completed === quizStats.total 
              ? (dict?.dashboard?.all_quizzes_done || "All daily quizzes completed! Check back tomorrow.")
              : (dict?.dashboard?.more_quizzes || `You have ${quizStats.total - quizStats.completed} more quizzes to complete today.`)}
          </p>
          {quizStats.completed < quizStats.total && (
            <Link href={`/${lang}/dashboard/quizzes`} className="btn btn-sm btn-ghost w-full">
              {dict?.dashboard?.finish_quizzes || 'Finish Quizzes'}
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="section-label mb-1 text-[var(--purple)]">{dict?.common?.videos || 'Video Tasks'}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-[var(--text-primary)]">
                {videoStats.watched} / {videoStats.total}
              </span>
              <span className="text-sm text-[var(--text-secondary)] font-learn">
                {dict?.dashboard?.watched || 'watched'}
              </span>
            </div>
          </div>
          <span className="badge badge-purple">Max: ${videoStats.maxReward.toFixed(2)}</span>
        </div>
        
        <div className="progress-track mb-5">
          <div className="h-full bg-[var(--purple)] rounded-sm transition-[width] duration-1000 ease-out" style={{ width: `${videoPct}%` }} />
        </div>

        <Link href={`/${lang}/dashboard/videos`} className="btn w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]">
          {dict?.dashboard?.go_to_videos || 'Go to Videos'}
        </Link>
      </motion.div>
    </div>
  )
}
