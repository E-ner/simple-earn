import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Cleanup Cron Job
 * 
 * Performs data retention cleanup:
 * 1. Delete notifications older than 30 days
 * 2. Delete closed support tickets older than 90 days
 * 
 * POST /api/cron/cleanup
 * Authorization: Bearer <CRON_SECRET>
 */

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 1. Delete old notifications (30+ days)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        isRead: true
      }
    })

    // 2. Delete closed support ticket messages (90+ days)
    const oldTickets = await prisma.supportTicket.findMany({
      where: {
        status: 'CLOSED',
        updatedAt: { lt: ninetyDaysAgo }
      },
      select: { id: true }
    })

    let deletedMessages = 0
    let deletedTickets = 0

    if (oldTickets.length > 0) {
      const ticketIds = oldTickets.map(t => t.id)

      const msgResult = await prisma.supportMessage.deleteMany({
        where: { ticketId: { in: ticketIds } }
      })
      deletedMessages = msgResult.count

      const ticketResult = await prisma.supportTicket.deleteMany({
        where: { id: { in: ticketIds } }
      })
      deletedTickets = ticketResult.count
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        deletedNotifications: deletedNotifications.count,
        deletedMessages,
        deletedTickets
      }
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json({ error: 'Cleanup job failed' }, { status: 500 })
  }
}
