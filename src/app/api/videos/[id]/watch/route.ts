import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { apiLimiter } from '@/lib/rateLimit'

const watchSchema = z.object({
  watchDurationSeconds: z.number().min(5),
  verificationCode: z.string().optional()
})

import { completeVideo } from '@/app/actions/videoActions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 20 video requests per minute per user
    const { success: allowed } = apiLimiter.check(20, `video:${session.user.id}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }


    const userId = session.user.id
    console.log('Video POST UserId:', userId)
    const body = await request.json()
    console.log('Video POST Body:', body)
    const { watchDurationSeconds, verificationCode } = watchSchema.parse(body)

    // Verify Video belongs to system and is active
    const video = await prisma.video.findUnique({
      where: { id: videoId, isActive: true },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Server-side validation that they actually watched it
    const minimumAcceptableDuration = video.duration * 0.9
    if (watchDurationSeconds < minimumAcceptableDuration) {
      return NextResponse.json({ error: 'Watch duration too short. Please watch the full video.' }, { status: 400 })
    }

    // Use the unified server action
    const result = await completeVideo(videoId, verificationCode)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        earnedAmount: result.reward 
      })
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to process' 
      }, { status: 400 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Video Watch Submit Error:', error)
    return NextResponse.json({ error: 'Failed to process video reward' }, { status: 500 })
  }
}
