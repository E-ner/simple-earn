import { getAllQuizzes, getAllVideos, getScheduleForDate, getGameConfig } from '@/app/actions/adminActions'
import { ContentSchedulerClient } from '@/components/admin/ContentSchedulerClient'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ContentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const today = new Date().toISOString().split('T')[0]
  const [quizzes, videos, todaySchedule, gameConfig] = await Promise.all([
    getAllQuizzes(),
    getAllVideos(),
    getScheduleForDate(today),
    getGameConfig(),
  ])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-(--purple)" />
          <span className="text-[10px] font-black text-(--purple) uppercase tracking-widest">Content Scheduling</span>
        </div>
        <h1 className="text-2xl font-black text-(--text-primary) tracking-tighter">Daily Content Scheduler</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">Select which quizzes and videos are available each day.</p>
      </div>
      <ContentSchedulerClient
        quizzes={quizzes}
        videos={videos}
        initialSchedule={todaySchedule}
        defaultDate={today}
        gameConfig={gameConfig}
      />
    </div>
  )
}