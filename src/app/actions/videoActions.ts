'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getTodayUTC } from '@/lib/dateconfig'

const DAILY_VIDEO_LIMIT = 2

export async function getVideoDailyStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { watched: 0, limit: DAILY_VIDEO_LIMIT }

  const today = getTodayUTC()

  const watchedToday = await prisma.videoWatch.count({
    where: {
      userId: session.user.id,
      watchedAt: { gte: today }
    }
  })

  return { watched: watchedToday, limit: DAILY_VIDEO_LIMIT }
}

export async function getVideos() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const today = getTodayUTC()

  const schedule = await prisma.dailySchedule.findUnique({
    where: { date: today }
  })

  if (!schedule || !Array.isArray(schedule.videoIds) || schedule.videoIds.length === 0) {
    return []
  }

  const scheduledVideoIds = schedule.videoIds as string[]

  const videos = await prisma.video.findMany({
    where: {
      id: { in: scheduledVideoIds },
      isActive: true
    },
    orderBy: { createdAt: 'desc' },
    include: {
      watches: {
        where: { userId: session.user.id }
      }
    }
  })

  return videos.map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    url: v.url,
    thumbnailUrl: v.thumbnailUrl,
    reward: Number(v.reward),
    duration: v.duration,
    isWatched: v.watches.length > 0,
    hasVerificationCode: !!v.verificationCode,
    isNewUserVideo: v.isNewUserVideo
  }))
}

export async function completeVideo(videoId: string, verificationCode?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const video = await prisma.video.findUnique({ where: { id: videoId } })
  if (!video) throw new Error('Video not found')

  if (video.verificationCode && video.verificationCode !== verificationCode) {
    throw new Error('Invalid verification code')
  }

  const existingWatch = await prisma.videoWatch.findFirst({
    where: { userId: session.user.id, videoId }
  })

  if (existingWatch) return { success: true, reward: 0, message: 'Already rewarded' }

  const today = getTodayUTC()
  const watchedToday = await prisma.videoWatch.count({
    where: { userId: session.user.id, watchedAt: { gte: today } }
  })

  if (watchedToday >= DAILY_VIDEO_LIMIT) {
    return { success: false, reward: 0, message: 'Daily video limit reached (2 per day). Come back tomorrow!' }
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.videoWatch.create({
      data: {
        userId: session.user.id,
        videoId,
        earnedAmount: video.reward,
        scheduledDate: today
      }
    })
    await tx.user.update({
      where: { id: session.user.id },
      data: { mainBalance: { increment: video.reward } }
    })
    await tx.protocolTransaction.create({
      data: {
        userId: session.user.id,
        type: 'EARNING',
        amount: video.reward,
        status: 'COMPLETED',
        notes: `Video Reward: ${video.title}`,
        currency: 'USD'
      }
    })
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: 'Video Reward Credited',
        message: `You earned $${video.reward} for watching "${video.title}".`,
        type: 'EARNING'
      }
    })
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/videos')
  revalidatePath('/dashboard/wallet')

  return { success: true, reward: Number(video.reward), message: 'Protocol Validated' }
}