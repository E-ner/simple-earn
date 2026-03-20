'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Clock, DollarSign, CheckCircle2, AlertCircle, Video } from 'lucide-react'
import EmptyState from '@/components/dashboard/EmptyState'
import Image from 'next/image'
import { useToast } from '@/context/ToastContext'

interface Video {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl: string
  reward: number
  duration: number
  isWatched: boolean
  hasVerificationCode: boolean
  isNewUserVideo: boolean
}

import { getVideos, completeVideo, getVideoDailyStatus } from '@/app/actions/videoActions'
import { formatCurrency } from '@/lib/currency'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'

export default function VideosPage() {
  const { showToast } = useToast()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [watchingVideo, setWatchingVideo] = useState<Video | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [canComplete, setCanComplete] = useState(false)
  const [dailyStatus, setDailyStatus] = useState({ watched: 0, limit: 2 })
  const [dict, setDict] = useState<any>(null)
  const { lang } = useParams()

  useEffect(() => {
    async function loadResources() {
      try {
        const [videoData, dictionary, status] = await Promise.all([
          getVideos(),
          getDictionary(lang as Locale),
          getVideoDailyStatus()
        ])
        setVideos(videoData)
        setDict(dictionary)
        setDailyStatus(status)
      } catch (error) {
        console.error('Failed to load videos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadResources()
  }, [lang])

  const handleStartWatch = (video: Video) => {
    setWatchingVideo(video)
    setVerificationCode('')
    setCanComplete(false)
    setTimeout(() => setCanComplete(true), video.duration * 1000)
  }

  const handleComplete = async () => {
    if (!watchingVideo) return
    
    try {
      const result = await completeVideo(watchingVideo.id, verificationCode)
      if (result.success && result.reward > 0) {
        setVideos(prev => prev.map(v => v.id === watchingVideo.id ? { ...v, isWatched: true } : v))
        setWatchingVideo(null)
        setDailyStatus(prev => ({ ...prev, watched: prev.watched + 1 }))
        showToast(`Protocol Validated: +${formatCurrency(result.reward)}`, 'SUCCESS')
      } else if (result.success && result.reward === 0) {
        setWatchingVideo(null)
        showToast(result.message || 'Already rewarded', 'INFO')
      } else {
        showToast(result.message || 'Failed to process', 'ERROR')
      }
    } catch (error) {
      showToast('Engagement verification failed', 'ERROR')
    }
  }

  return (
    <div className="pb-20">
      <header className="mb-8 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">{dict?.videos?.title || 'Earning Catalog'}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
            <Video className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">
              {dailyStatus.watched}/{dailyStatus.limit} Today
            </span>
          </div>
        </div>
        <p className="text-[#888] text-sm max-w-2xl">
          {dict?.videos?.desc || 'Watch curated training modules to earn digital assets. Maximum 2 videos per day.'}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-md bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group p-4 rounded-md bg-[#16161e] border border-white/[0.06] hover:border-[var(--accent)]/30 transition-all ${video.isWatched ? 'opacity-70' : ''}`}
            >
              <div className="relative aspect-video rounded-sm overflow-hidden mb-4 bg-black">
                {video.thumbnailUrl ? (
                  <Image 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    fill 
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]">
                    <Video className="w-12 h-12 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-sm bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
              </div>

              <div className="space-y-3">
                {video.isNewUserVideo && (
                  <div className="inline-block px-2 py-0.5 rounded-sm bg-[var(--purple)]/20 border border-[var(--purple)]/30 text-[9px] font-black text-[var(--purple)] uppercase tracking-widest mb-1">
                    Onboarding Module
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-white text-sm leading-snug">{video.title}</h3>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-black text-[var(--accent)]">
                    + {formatCurrency(video.reward)}
                  </div>
                </div>
                <p className="text-xs text-[#555] line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
                <div className="pt-4 flex items-center justify-between">
                  {video.isWatched ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--accent)]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {dict?.videos?.completed || 'COMPLETED'}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleStartWatch(video)}
                      className="w-full h-10 rounded-md bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                      {dict?.videos?.analyze || 'Analyze Source'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {watchingVideo && (
        <div className="fixed inset-0 z-[100] bg-[#06060a]/95 backdrop-blur-2xl overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8 md:py-12">
            <div className="max-w-2xl w-full flex flex-col gap-4">
              {/* Close button */}
              <button 
                onClick={() => setWatchingVideo(null)}
                className="self-end text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-white transition-colors"
              >
                ✕ Close
              </button>

              {/* Video Player — reduced size */}
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                {watchingVideo.url.includes('youtube.com') || watchingVideo.url.includes('youtu.be') ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${watchingVideo.url.split('v=')[1]?.split('&')[0] || watchingVideo.url.split('/').pop()}?autoplay=1&rel=0&controls=1`}
                    title={watchingVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={watchingVideo.url} controls autoPlay className="w-full h-full" />
                )}
              </div>

              {/* Controls panel */}
              <div className="bg-[#16161e] border border-white/[0.08] p-6 rounded-lg space-y-4 w-full">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black text-white tracking-tight">{watchingVideo.title}</h2>
                  <p className="text-[#888] text-[10px] font-bold uppercase tracking-widest">
                    Watch the full video to extract the verification code.
                  </p>
                </div>

                {watchingVideo.hasVerificationCode && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[var(--accent)] uppercase tracking-widest text-center">
                      Enter Verification Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter the code shown in the video"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-2.5 text-center text-white font-mono tracking-widest text-sm focus:border-[var(--accent)] outline-none transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-3 justify-center pt-1">
                  <button 
                    onClick={() => setWatchingVideo(null)}
                    className="px-6 py-2.5 rounded-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!canComplete || (watchingVideo.hasVerificationCode && !verificationCode) || dailyStatus.watched >= dailyStatus.limit}
                    onClick={handleComplete}
                    className="px-6 py-2.5 rounded-md bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {dailyStatus.watched >= dailyStatus.limit
                      ? 'Daily Limit Reached'
                      : canComplete
                        ? 'Validate & Claim'
                        : 'Analyzing...'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {videos.length === 0 && (
        <div className="mt-10">
          <EmptyState 
            icon={Video}
            title="Training Modules Offline"
            description="No high-yield training modules are available for analysis in this cycle. Return when the catalog refreshes."
          />
        </div>
      )}
    </div>
  )
}
