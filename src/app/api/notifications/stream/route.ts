import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Server-Sent Events endpoint for real-time notifications.
 * Client connects and receives a stream of new notifications.
 * 
 * GET /api/notifications/stream
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial unread count
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      })

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'count', count: unreadCount })}\n\n`)
      )

      // Poll for new notifications every 10 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval)
          return
        }

        try {
          const count = await prisma.notification.count({
            where: { userId, isRead: false }
          })

          const recent = await prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'update', count, notifications: recent })}\n\n`)
          )
        } catch {
          // Connection likely closed
          clearInterval(interval)
        }
      }, 10_000)

      // Cleanup on close
      setTimeout(() => {
        closed = true
        clearInterval(interval)
        try { controller.close() } catch {}
      }, 5 * 60 * 1000) // Close after 5 minutes (client should reconnect)
    },

    cancel() {
      closed = true
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
