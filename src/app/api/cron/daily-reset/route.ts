import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Daily Reset Cron Job
 * 
 * This route is designed to be called by a cron service (e.g., Vercel Cron, systemd timer, or external scheduler).
 * It performs daily cleanup and reset tasks:
 * 
 * 1. Marks old unread notifications as read (older than 7 days)
 * 2. Cleans up expired email verification tokens
 * 3. Cleans up expired password reset tokens
 * 
 * POST /api/cron/daily-reset
 * Authorization: Bearer <CRON_SECRET>
 */

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 1. Mark old unread notifications as read
    const notificationsUpdated = await prisma.notification.updateMany({
      where: {
        isRead: false,
        createdAt: { lt: sevenDaysAgo }
      },
      data: { isRead: true }
    })

    // 2. Clean up expired email verification tokens
    const expiredTokens = await prisma.user.updateMany({
      where: {
        emailVerifyToken: { not: null },
        emailVerifyExpiry: { lt: now }
      },
      data: {
        emailVerifyToken: null,
        emailVerifyExpiry: null
      }
    })

    // 3. Clean up expired password reset tokens
    const expiredResets = await prisma.user.updateMany({
      where: {
        resetPasswordToken: { not: null },
        resetPasswordExpiry: { lt: now }
      },
      data: {
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        notificationsMarkedRead: notificationsUpdated.count,
        expiredTokensCleaned: expiredTokens.count,
        expiredResetsCleaned: expiredResets.count
      }
    })
  } catch (error) {
    console.error('Daily reset cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
