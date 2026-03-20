'use server'

import prisma from '@/lib/prisma'
import { requireAdmin } from './adminActions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

export async function getAllTickets() {
  await requireAdmin()
  return prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { username: true, email: true } },
      _count: { select: { messages: true } }
    }
  })
}

export async function getTicketDetails(ticketId: string) {
  await requireAdmin()
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { username: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { username: true, role: true } } }
      }
    }
  })
}

export async function replyToTicket(ticketId: string, message: string) {
  const admin = await requireAdmin()
  await prisma.supportMessage.create({
    data: {
      ticketId,
      senderId: admin.id,
      message
    }
  })
  
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  })
  
  revalidatePath('/admin/support')
}

export async function closeTicket(ticketId: string) {
  await requireAdmin()
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: 'CLOSED' }
  })
  revalidatePath('/admin/support')
}

// ----- User Actions -----

export async function getUserTickets() {
  const user = await getAuthUser()
  return prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 1 }
    }
  })
}

export async function createTicket(subject: string, message: string) {
  const user = await getAuthUser()
  
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject,
      status: 'OPEN',
      messages: {
        create: {
          senderId: user.id,
          message
        }
      }
    }
  })

  revalidatePath('/dashboard/support')
  return ticket
}

export async function getTicketMessages(ticketId: string) {
  const user = await getAuthUser()
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { username: true, role: true } } }
      }
    }
  })

  if (!ticket || ticket.userId !== user.id) {
    throw new Error('Ticket not found or unauthorized')
  }

  return ticket
}

export async function sendTicketMessage(ticketId: string, message: string) {
  const user = await getAuthUser()
  
  // Verify ownership
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.userId !== user.id) throw new Error('Unauthorized')

  await prisma.supportMessage.create({
    data: {
      ticketId,
      senderId: user.id,
      message
    }
  })

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: 'OPEN', updatedAt: new Date() }
  })

  revalidatePath(`/dashboard/support/${ticketId}`)
}
