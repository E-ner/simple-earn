'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

// ----- Auth Helper -----
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return session.user
}

// ----- Stats -----
export async function getAdminStats() {
  await requireAdmin()
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers, 
    activeUsers, 
    pendingTx, 
    totalPayout, 
    openTickets,
    recentUsers,
    recentTxs,
    depositAgg,
    withdrawalAgg
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.protocolTransaction.count({ where: { status: 'PENDING' } }),
    prisma.protocolTransaction.aggregate({
      where: { type: 'WITHDRAWAL', status: 'APPROVED' },
      _sum: { amount: true }
    }),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true }
    }),
    prisma.protocolTransaction.findMany({
      where: { 
        status: 'APPROVED',
        createdAt: { gte: thirtyDaysAgo },
        type: { in: ['DEPOSIT', 'WITHDRAWAL'] }
      },
      select: { amount: true, type: true, createdAt: true }
    }),
    prisma.protocolTransaction.aggregate({
      where: { type: 'DEPOSIT', status: 'APPROVED' },
      _sum: { amount: true }
    }),
    prisma.protocolTransaction.aggregate({
      where: { type: 'WITHDRAWAL', status: 'APPROVED' },
      _sum: { amount: true }
    })
  ])

  // Group user growth by day
  const dailyUsers: { [key: string]: number } = {}
  recentUsers.forEach(u => {
    const date = u.createdAt.toISOString().split('T')[0]
    dailyUsers[date] = (dailyUsers[date] || 0) + 1
  })

  // Group earnings/cashflow by day
  const dailyCashflow: { [key: string]: { deposits: number, withdrawals: number } } = {}
  recentTxs.forEach(tx => {
    const date = tx.createdAt.toISOString().split('T')[0]
    if (!dailyCashflow[date]) dailyCashflow[date] = { deposits: 0, withdrawals: 0 }
    if (tx.type === 'DEPOSIT') dailyCashflow[date].deposits += Number(tx.amount)
    else dailyCashflow[date].withdrawals += Number(tx.amount)
  })

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    pendingTx,
    totalPayout: Number(totalPayout._sum.amount || 0),
    totalDeposits: Number(depositAgg._sum.amount || 0),
    totalWithdrawals: Number(withdrawalAgg._sum.amount || 0),
    openTickets,
    userGrowth: Object.entries(dailyUsers).map(([date, count]) => ({ date, count })),
    cashflow: Object.entries(dailyCashflow).map(([date, data]) => ({ date, ...data })),
  }
}

// ----- Users -----
export async function getAllUsers(page = 1, search = '') {
  await requireAdmin()
  const take = 20
  const skip = (page - 1) * take
  const where: any = search ? {
    role: 'USER',
    OR: [
      { email: { contains: search, mode: 'insensitive' as const } },
      { username: { contains: search, mode: 'insensitive' as const } },
    ]
  } : { role: 'USER' }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, username: true, role: true,
        isActive: true, isEmailVerified: true, isSuspended: true,
        mainBalance: true, gameBalance: true, country: true, createdAt: true,
      }
    }),
    prisma.user.count({ where }),
  ])

  const serializedUsers = users.map(u => ({
    ...u,
    mainBalance: Number(u.mainBalance),
    gameBalance: Number(u.gameBalance)
  }))

  return { users: serializedUsers, total, pages: Math.ceil(total / take) }
}


export async function suspendUser(userId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: true } })
  revalidatePath('/admin/users')
}

export async function unsuspendUser(userId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: false } })
  revalidatePath('/admin/users')
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/admin/users')
}

export async function activateUser(userId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { isActive: true } })
  revalidatePath('/admin/users')
}

export async function adminResetPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })
}

// ----- Transactions -----
export async function getPendingTransactions() {
  await requireAdmin()
  const txs = await prisma.protocolTransaction.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { username: true, email: true } } },
  })
  return txs.map(tx => ({ ...tx, amount: Number(tx.amount) }))
}

export async function getAllTransactions(page = 1) {
  await requireAdmin()
  const take = 25
  const skip = (page - 1) * take
  const [transactions, total] = await Promise.all([
    prisma.protocolTransaction.findMany({
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, email: true } } },
    }),
    prisma.protocolTransaction.count(),
  ])
  return { 
    transactions: transactions.map(tx => ({ ...tx, amount: Number(tx.amount) })), 
    total, 
    pages: Math.ceil(total / take) 
  }
}

export async function approveTransaction(txId: string) {
  await requireAdmin()
  const admin = await requireAdmin()
  const tx = await prisma.protocolTransaction.findUnique({ where: { id: txId } })
  if (!tx) throw new Error('Transaction not found')

  await prisma.$transaction(async (db) => {
    await db.protocolTransaction.update({
      where: { id: txId },
      data: { status: 'APPROVED', approvedBy: admin.id, approvedAt: new Date() }
    })
    // For withdrawals, deduct from user balance
    if (tx.type === 'WITHDRAWAL') {
      await db.user.update({
        where: { id: tx.userId },
        data: { mainBalance: { decrement: tx.amount } }
      })
    }
    // For deposits, credit user balance
    if (tx.type === 'DEPOSIT') {
      await db.user.update({
        where: { id: tx.userId },
        data: { mainBalance: { increment: tx.amount } }
      })
    }
    // For activation, set both isActive and isActivated to true
    if (tx.type === 'ACTIVATION') {
      await db.user.update({
        where: { id: tx.userId },
        data: { isActive: true, isActivated: true }
      })
    }
    // For game deposit, credit game balance
    if (tx.type === 'GAME_DEPOSIT') {
      await db.user.update({
        where: { id: tx.userId },
        data: { gameBalance: { increment: tx.amount } }
      })
    }
    // Notify user
    await db.notification.create({
      data: {
        userId: tx.userId,
        title: `Transaction ${tx.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Deposit'} Approved`,
        message: `Your ${tx.type.toLowerCase()} of $${Number(tx.amount).toFixed(2)} has been approved.`,
        type: 'TRANSACTION',
      }
    })
  })
  revalidatePath('/admin/transactions')
}

export async function rejectTransaction(txId: string, reason: string) {
  await requireAdmin()
  const tx = await prisma.protocolTransaction.findUnique({ where: { id: txId } })
  if (!tx) throw new Error('Transaction not found')

  await prisma.$transaction(async (db) => {
    await db.protocolTransaction.update({
      where: { id: txId },
      data: { status: 'REJECTED', notes: reason }
    })
    await db.notification.create({
      data: {
        userId: tx.userId,
        title: 'Transaction Rejected',
        message: `Your ${tx.type.toLowerCase()} request was rejected. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'TRANSACTION',
      }
    })
  })
  revalidatePath('/admin/transactions')
}

// ----- Content Scheduling -----
export async function getAllQuizzes() {
  await requireAdmin()
  const quizzes = await prisma.quiz.findMany({ orderBy: { createdAt: 'desc' }, include: { questions: true } })
  return quizzes.map(q => ({ ...q, reward: Number(q.reward) }))
}

export async function getAllVideos() {
  await requireAdmin()
  const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } })
  return videos.map(v => ({ ...v, reward: Number(v.reward) }))
}

export async function getScheduleForDate(dateStr: string) {
  await requireAdmin()
  const date = new Date(dateStr)
  return prisma.dailySchedule.findFirst({ where: { date } })
}

export async function adminCreateVideo(data: { 
  title: string, 
  url: string, 
  reward: number, 
  duration: number,
  verificationCode?: string,
  isNewUserVideo?: boolean
}) {
  await requireAdmin()
  await prisma.video.create({
    data: {
      title: data.title,
      url: data.url,
      reward: data.reward,
      duration: data.duration,
      verificationCode: data.verificationCode,
      isNewUserVideo: data.isNewUserVideo ?? false,
      isActive: true
    }
  })
  revalidatePath('/admin/content')
}

export async function adminDeleteVideo(id: string) {
  await requireAdmin()
  await prisma.video.delete({ where: { id } })
  revalidatePath('/admin/content')
}

export async function adminDeleteQuiz(id: string) {
  await requireAdmin()
  await prisma.quiz.delete({ where: { id } })
  revalidatePath('/admin/content')
}

export async function adminCreateQuiz(data: { title: string, reward: number }, questions: { question: string, options: string[], correctIndex: number }[]) {
  await requireAdmin()
  await prisma.quiz.create({
    data: {
      title: data.title,
      reward: data.reward,
      isActive: true,
      questions: {
        create: questions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          order: i
        }))
      }
    }
  })
  revalidatePath('/admin/content')
}

export async function setDailySchedule(dateStr: string, quizIds: string[], videoIds: string[]) {
  await requireAdmin()
  const date = new Date(dateStr)
  await prisma.dailySchedule.upsert({
    where: { date },
    create: { date, quizIds, videoIds },
    update: { quizIds, videoIds }
  })
  revalidatePath('/admin/content')
}

// ----- Game Config -----
export async function getGameConfig() {
  await requireAdmin()
  return prisma.gameConfig.findUnique({ where: { id: 'singleton' } })
}

export async function updateGameConfig(data: {
  t2000WinToken?: string, t5000WinToken?: string, t10000WinToken?: string,
  t2000DailyLimit?: number, t5000DailyLimit?: number, t10000DailyLimit?: number,
}) {
  await requireAdmin()
  await prisma.gameConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data
  })
  revalidatePath('/admin/games')
}

// ----- Payment Methods -----
export async function getAllPaymentMethods() {
  await requireAdmin()
  return prisma.paymentMethod.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createPaymentMethod(data: {
  name: string, type: string, instructions?: string, country?: string
}) {
  await requireAdmin()
  await prisma.paymentMethod.create({ data: data as any })
  revalidatePath('/admin/payments')
}

export async function togglePaymentMethod(id: string, isActive: boolean) {
  await requireAdmin()
  await prisma.paymentMethod.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/payments')
}

export async function deletePaymentMethod(id: string) {
  await requireAdmin()
  await prisma.paymentMethod.delete({ where: { id } })
  revalidatePath('/admin/payments')
}

// ----- Support -----
export async function getAllTickets(status?: string) {
  await requireAdmin()
  const where = status ? { status: status as any } : {}
  return prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { username: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { username: true, role: true } } } }
    }
  })
}

export async function replyToTicket(ticketId: string, message: string) {
  const admin = await requireAdmin()
  await prisma.supportMessage.create({
    data: { ticketId, senderId: admin.id, message }
  })
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: 'IN_PROGRESS', updatedAt: new Date() }
  })
  revalidatePath('/admin/support')
}

export async function closeTicket(ticketId: string) {
  await requireAdmin()
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'CLOSED' } })
  revalidatePath('/admin/support')
}

export async function reopenTicket(ticketId: string) {
  await requireAdmin()
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } })
  revalidatePath('/admin/support')
}
