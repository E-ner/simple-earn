import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth"
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Only get active videos
    const videos = await prisma.video.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        reward: true,
        duration: true
      }
    })

    // Check which ones the user has already watched today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Using simple approach without composite scheduledDate checks for now
    const watches = await prisma.videoWatch.findMany({
      where: {
        userId,
        watchedAt: {
          gte: today
        }
      }
    })

    const watchedVideoIds = new Set(watches.map((w: { videoId: string }) => w.videoId))

    const safeVideos = videos.map((video: any) => ({
      ...video,
      isWatchedToday: watchedVideoIds.has(video.id)
    }))

    return NextResponse.json({ videos: safeVideos })
  } catch (error) {
    console.error('Fetch Videos Error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
