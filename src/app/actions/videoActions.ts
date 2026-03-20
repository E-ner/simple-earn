'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const DAILY_VIDEO_LIMIT = 2

export async function getVideoDailyStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { watched: 0, limit: DAILY_VIDEO_LIMIT }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  const videos = await prisma.video.findMany({
    where: { isActive: true },
    include: {
      watches: {
        where: { userId: session.user.id }
      }
    }
  })

  // Format the response to be more usable on client
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

  const video = await prisma.video.findUnique({
    where: { id: videoId }
  })

  if (!video) throw new Error('Video not found')

  // Verification code check
  if (video.verificationCode && video.verificationCode !== verificationCode) {
    throw new Error('Invalid verification code')
  }

  // Check if already watched this specific video
  const existingWatch = await prisma.videoWatch.findFirst({
    where: {
      userId: session.user.id,
      videoId: videoId
    }
  })

  if (existingWatch) return { success: true, reward: 0, message: 'Already rewarded' }

  // Check daily limit (2 videos per day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const watchedToday = await prisma.videoWatch.count({
    where: {
      userId: session.user.id,
      watchedAt: { gte: today }
    }
  })

  if (watchedToday >= DAILY_VIDEO_LIMIT) {
    return { success: false, reward: 0, message: 'Daily video limit reached (2 per day). Come back tomorrow!' }
  }

  // Transaction for the reward
  await prisma.$transaction(async (tx: any) => {
    // 1. Create VideoWatch record
    await tx.videoWatch.create({
      data: {
        userId: session.user.id,
        videoId: videoId,
        earnedAmount: video.reward,
        scheduledDate: new Date() // Today
      }
    })

    // 2. Update user balance
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        mainBalance: {
          increment: video.reward
        }
      }
    })

    // 3. Create ProtocolTransaction record
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

    // 4. Notification
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
