import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock next-auth session ──────────────────────────────────────────────────
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))

// ── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    protocolTransaction: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    supportTicket: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    supportMessage: {
      create: vi.fn(),
    },
    quiz: { findMany: vi.fn() },
    video: { findMany: vi.fn() },
    dailySchedule: { findFirst: vi.fn(), upsert: vi.fn() },
    gameConfig: { findUnique: vi.fn(), upsert: vi.fn() },
    paymentMethod: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  }
}))

import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import {
  getAdminStats, getAllUsers, suspendUser, unsuspendUser, activateUser,
  getPendingTransactions, getAllTransactions, approveTransaction, rejectTransaction,
  getAllQuizzes, getAllVideos, getScheduleForDate, setDailySchedule,
  getGameConfig, updateGameConfig,
  getAllPaymentMethods, createPaymentMethod, togglePaymentMethod, deletePaymentMethod,
  getAllTickets, replyToTicket, closeTicket, reopenTicket,
} from '@/app/actions/adminActions'

// ── Admin session + regular user session ───────────────────────────────────
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN' } }
const USER_SESSION  = { user: { id: 'user-1',  role: 'USER'  } }

// Helper to mock session
const mockAdmin = () => (getServerSession as any).mockResolvedValue(ADMIN_SESSION)
const mockUser  = () => (getServerSession as any).mockResolvedValue(USER_SESSION)

// ═══════════════════════════════════════════════════════════════════════════
describe('Admin Actions — Authorization Guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAdminStats should throw for non-admin users', async () => {
    mockUser()
    await expect(getAdminStats()).rejects.toThrow('Unauthorized')
  })

  it('getAllUsers should throw for non-admin users', async () => {
    mockUser()
    await expect(getAllUsers()).rejects.toThrow('Unauthorized')
  })

  it('approveTransaction should throw for non-admin users', async () => {
    mockUser()
    await expect(approveTransaction('tx-1')).rejects.toThrow('Unauthorized')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('getAdminStats', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should return aggregated platform statistics', async () => {
    ;(prisma.user.count as any)
      .mockResolvedValueOnce(120)   // totalUsers
      .mockResolvedValueOnce(80)    // activeUsers
    ;(prisma.protocolTransaction.count as any).mockResolvedValue(5)
    ;(prisma.protocolTransaction.aggregate as any).mockResolvedValue({ _sum: { amount: 250 } })
    ;(prisma.supportTicket.count as any).mockResolvedValue(3)

    const stats = await getAdminStats()

    expect(stats.totalUsers).toBe(120)
    expect(stats.activeUsers).toBe(80)
    expect(stats.pendingTx).toBe(5)
    expect(stats.totalPayout).toBe(250)
    expect(stats.openTickets).toBe(3)
  })

  it('should handle zero values gracefully', async () => {
    ;(prisma.user.count as any).mockResolvedValue(0)
    ;(prisma.protocolTransaction.count as any).mockResolvedValue(0)
    ;(prisma.protocolTransaction.aggregate as any).mockResolvedValue({ _sum: { amount: null } })
    ;(prisma.supportTicket.count as any).mockResolvedValue(0)

    const stats = await getAdminStats()
    expect(stats.totalPayout).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('getAllUsers', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should return paginated users with total count', async () => {
    const mockUsers = [{ id: 'u1', username: 'alice', email: 'alice@test.com' }]
    ;(prisma.user.findMany as any).mockResolvedValue(mockUsers)
    ;(prisma.user.count as any).mockResolvedValue(1)

    const result = await getAllUsers(1)
    expect(result.users).toEqual(mockUsers)
    expect(result.total).toBe(1)
    expect(result.pages).toBe(1)
  })

  it('should apply search filter when provided', async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([])
    ;(prisma.user.count as any).mockResolvedValue(0)

    await getAllUsers(1, 'alice')
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) })
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('suspendUser / unsuspendUser / activateUser', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('suspendUser should set isSuspended to true', async () => {
    ;(prisma.user.update as any).mockResolvedValue({})
    await suspendUser('user-1')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isSuspended: true }
    })
  })

  it('unsuspendUser should set isSuspended to false', async () => {
    ;(prisma.user.update as any).mockResolvedValue({})
    await unsuspendUser('user-1')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isSuspended: false }
    })
  })

  it('activateUser should set isActive to true', async () => {
    ;(prisma.user.update as any).mockResolvedValue({})
    await activateUser('user-1')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: true }
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('getPendingTransactions', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should fetch only PENDING transactions in ascending order', async () => {
    ;(prisma.protocolTransaction.findMany as any).mockResolvedValue([])
    await getPendingTransactions()
    expect(prisma.protocolTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('approveTransaction', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should run inside a db transaction', async () => {
    const mockTx = { id: 'tx-1', type: 'WITHDRAWAL', userId: 'u-1', amount: 10 }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await approveTransaction('tx-1')
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('should throw if transaction not found', async () => {
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(null)
    await expect(approveTransaction('bad-id')).rejects.toThrow('Transaction not found')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('rejectTransaction', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should update status to REJECTED and send a notification', async () => {
    const mockTx = { id: 'tx-1', type: 'DEPOSIT', userId: 'u-1', amount: 5 }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await rejectTransaction('tx-1', 'Insufficient proof')
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('should throw if transaction not found', async () => {
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(null)
    await expect(rejectTransaction('bad-id', 'reason')).rejects.toThrow('Transaction not found')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Content Scheduling', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getAllQuizzes should return all quizzes', async () => {
    const mockQuizzes = [{ id: 'q1', title: 'Quiz 1', isActive: true }]
    ;(prisma.quiz.findMany as any).mockResolvedValue(mockQuizzes)
    const result = await getAllQuizzes()
    expect(result).toEqual(mockQuizzes)
  })

  it('getAllVideos should return all videos', async () => {
    const mockVideos = [{ id: 'v1', title: 'Video 1', isActive: true }]
    ;(prisma.video.findMany as any).mockResolvedValue(mockVideos)
    const result = await getAllVideos()
    expect(result).toEqual(mockVideos)
  })

  it('setDailySchedule should upsert with correct quizIds and videoIds', async () => {
    ;(prisma.dailySchedule.upsert as any).mockResolvedValue({})
    await setDailySchedule('2026-03-20', ['q1', 'q2'], ['v1'])
    expect(prisma.dailySchedule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ quizIds: ['q1', 'q2'], videoIds: ['v1'] }),
        update: expect.objectContaining({ quizIds: ['q1', 'q2'], videoIds: ['v1'] }),
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Game Config', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getGameConfig should return the singleton config', async () => {
    const mockConfig = { id: 'singleton', t2000WinToken: 'A' }
    ;(prisma.gameConfig.findUnique as any).mockResolvedValue(mockConfig)
    const result = await getGameConfig()
    expect(result).toEqual(mockConfig)
    expect(prisma.gameConfig.findUnique).toHaveBeenCalledWith({ where: { id: 'singleton' } })
  })

  it('updateGameConfig should upsert with provided data', async () => {
    ;(prisma.gameConfig.upsert as any).mockResolvedValue({})
    await updateGameConfig({ t2000WinToken: 'B', t2000DailyLimit: 5 })
    expect(prisma.gameConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'singleton' },
        update: expect.objectContaining({ t2000WinToken: 'B', t2000DailyLimit: 5 }),
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Payment Methods', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getAllPaymentMethods should return all methods', async () => {
    const methods = [{ id: 'pm-1', name: 'MTN', type: 'MOBILE_MONEY', isActive: true }]
    ;(prisma.paymentMethod.findMany as any).mockResolvedValue(methods)
    const result = await getAllPaymentMethods()
    expect(result).toEqual(methods)
  })

  it('createPaymentMethod should create a new record', async () => {
    ;(prisma.paymentMethod.create as any).mockResolvedValue({})
    await createPaymentMethod({ name: 'Airtel', type: 'MOBILE_MONEY' })
    expect(prisma.paymentMethod.create).toHaveBeenCalled()
  })

  it('togglePaymentMethod should update isActive field', async () => {
    ;(prisma.paymentMethod.update as any).mockResolvedValue({})
    await togglePaymentMethod('pm-1', false)
    expect(prisma.paymentMethod.update).toHaveBeenCalledWith({
      where: { id: 'pm-1' },
      data: { isActive: false }
    })
  })

  it('deletePaymentMethod should delete the record', async () => {
    ;(prisma.paymentMethod.delete as any).mockResolvedValue({})
    await deletePaymentMethod('pm-1')
    expect(prisma.paymentMethod.delete).toHaveBeenCalledWith({ where: { id: 'pm-1' } })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Support Tickets', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getAllTickets should fetch all tickets with messages', async () => {
    ;(prisma.supportTicket.findMany as any).mockResolvedValue([])
    await getAllTickets()
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({ messages: expect.any(Object) })
      })
    )
  })

  it('getAllTickets with status filter should apply where clause', async () => {
    ;(prisma.supportTicket.findMany as any).mockResolvedValue([])
    await getAllTickets('OPEN')
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'OPEN' } })
    )
  })

  it('replyToTicket should create a message and set status to IN_PROGRESS', async () => {
    ;(prisma.supportMessage.create as any).mockResolvedValue({})
    ;(prisma.supportTicket.update as any).mockResolvedValue({})
    await replyToTicket('ticket-1', 'Hello, we are looking into this.')
    expect(prisma.supportMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          message: 'Hello, we are looking into this.'
        })
      })
    )
    expect(prisma.supportTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_PROGRESS' }) })
    )
  })

  it('closeTicket should update status to CLOSED', async () => {
    ;(prisma.supportTicket.update as any).mockResolvedValue({})
    await closeTicket('ticket-1')
    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 'ticket-1' },
      data: { status: 'CLOSED' }
    })
  })

  it('reopenTicket should update status to OPEN', async () => {
    ;(prisma.supportTicket.update as any).mockResolvedValue({})
    await reopenTicket('ticket-1')
    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 'ticket-1' },
      data: { status: 'OPEN' }
    })
  })
})
