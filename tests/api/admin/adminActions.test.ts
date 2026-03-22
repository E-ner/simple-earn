import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock next-auth session ──────────────────────────────────────────────────
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

// ── Auth options are imported from @/lib/auth (not the route) ──────────────
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))

// ── Mock currency lib (convertToUSD used in approveTransaction) ────────────
vi.mock('@/lib/currency', () => ({
  formatRaw: vi.fn((amount: number, currency: string) => `${currency} ${amount}`),
  convertToUSD: vi.fn((amount: number, _currency: string) => amount), // 1:1 in tests
  getCurrencyFromCountry: vi.fn(() => 'USD'),
  formatCurrency: vi.fn((amount: number) => `$${amount}`),
  COUNTRY_CURRENCY: {},
}))

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
    // setDailySchedule casts dailySchedule as `any` before calling upsert
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

// ── Session helpers ─────────────────────────────────────────────────────────
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN' } }
const USER_SESSION  = { user: { id: 'user-1',  role: 'USER'  } }

const mockAdmin = () => (getServerSession as any).mockResolvedValue(ADMIN_SESSION)
const mockUser  = () => (getServerSession as any).mockResolvedValue(USER_SESSION)

// Helper: fake Prisma Decimal that serialises cleanly
const decimal = (n: number) => ({ toNumber: () => n, valueOf: () => n, toString: () => String(n) })

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
      .mockResolvedValueOnce(120)  // totalUsers
      .mockResolvedValueOnce(80)   // activeUsers
    ;(prisma.user.findMany as any).mockResolvedValue([])
    ;(prisma.protocolTransaction.count as any).mockResolvedValue(5)
    ;(prisma.protocolTransaction.findMany as any).mockResolvedValue([])
    ;(prisma.protocolTransaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { amount: 250 } }) // totalPayout
      .mockResolvedValueOnce({ _sum: { amount: 500 } }) // totalDeposits
      .mockResolvedValueOnce({ _sum: { amount: 250 } }) // totalWithdrawals
    ;(prisma.supportTicket.count as any).mockResolvedValue(3)

    const stats = await getAdminStats()

    expect(stats.totalUsers).toBe(120)
    expect(stats.activeUsers).toBe(80)
    expect(stats.inactiveUsers).toBe(40)
    expect(stats.pendingTx).toBe(5)
    expect(stats.totalPayout).toBe(250)
    expect(stats.openTickets).toBe(3)
  })

  it('should handle zero / null aggregate values gracefully', async () => {
    ;(prisma.user.count as any).mockResolvedValue(0)
    ;(prisma.user.findMany as any).mockResolvedValue([])
    ;(prisma.protocolTransaction.count as any).mockResolvedValue(0)
    ;(prisma.protocolTransaction.findMany as any).mockResolvedValue([])
    ;(prisma.protocolTransaction.aggregate as any).mockResolvedValue({ _sum: { amount: null } })
    ;(prisma.supportTicket.count as any).mockResolvedValue(0)

    const stats = await getAdminStats()
    expect(stats.totalPayout).toBe(0)
    expect(stats.totalDeposits).toBe(0)
    expect(stats.totalWithdrawals).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('getAllUsers', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should return paginated users with serialised balances', async () => {
    const mockUsers = [{
      id: 'u1', username: 'alice', email: 'alice@test.com',
      mainBalance: decimal(10),
      gameBalance: decimal(2),
    }]
    ;(prisma.user.findMany as any).mockResolvedValue(mockUsers)
    ;(prisma.user.count as any).mockResolvedValue(1)

    const result = await getAllUsers(1)

    // Balances must be plain numbers, not Decimal objects
    expect(result.users[0].mainBalance).toBe(10)
    expect(result.users[0].gameBalance).toBe(2)
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

  it('should default to page 1 and skip 0 records', async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([])
    ;(prisma.user.count as any).mockResolvedValue(0)

    await getAllUsers()
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
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

  it('should serialise amount and localAmount to plain numbers', async () => {
    ;(prisma.protocolTransaction.findMany as any).mockResolvedValue([{
      id: 'tx-1', type: 'DEPOSIT', userId: 'u-1',
      amount: decimal(50),
      localAmount: decimal(65000), // e.g. RWF
      currency: 'RWF',
      status: 'PENDING',
    }])

    const result = await getPendingTransactions()
    expect(typeof result[0].amount).toBe('number')
    expect(typeof result[0].localAmount).toBe('number')
    expect(result[0].amount).toBe(50)
    expect(result[0].localAmount).toBe(65000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('getAllTransactions (admin)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should return paginated transactions with serialised amounts', async () => {
    ;(prisma.protocolTransaction.findMany as any).mockResolvedValue([{
      id: 'tx-1', type: 'DEPOSIT', userId: 'u-1',
      amount: decimal(10),
      localAmount: decimal(13000),
      currency: 'RWF', status: 'APPROVED',
    }])
    ;(prisma.protocolTransaction.count as any).mockResolvedValue(1)

    const result = await getAllTransactions(1)
    expect(result.transactions[0].amount).toBe(10)
    expect(result.transactions[0].localAmount).toBe(13000)
    expect(result.total).toBe(1)
    expect(result.pages).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('approveTransaction', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('should run inside a db transaction', async () => {
    // tx.amount is already USD — no currency conversion at approval time
    const mockTx = {
      id: 'tx-1', type: 'WITHDRAWAL', userId: 'u-1',
      amount: decimal(10), localAmount: decimal(13000), currency: 'RWF',
    }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await approveTransaction('tx-1')
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('should decrement mainBalance for WITHDRAWAL', async () => {
    const mockTx = {
      id: 'tx-1', type: 'WITHDRAWAL', userId: 'u-1',
      amount: decimal(10), localAmount: decimal(13000), currency: 'RWF',
    }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await approveTransaction('tx-1')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mainBalance: { decrement: 10 } })
      })
    )
  })

  it('should increment mainBalance for DEPOSIT', async () => {
    const mockTx = {
      id: 'tx-1', type: 'DEPOSIT', userId: 'u-1',
      amount: decimal(5), localAmount: decimal(6500), currency: 'RWF',
    }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await approveTransaction('tx-1')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mainBalance: { increment: 5 } })
      })
    )
  })

  it('should activate user for ACTIVATION type', async () => {
    const mockTx = {
      id: 'tx-1', type: 'ACTIVATION', userId: 'u-1',
      amount: decimal(10), localAmount: decimal(13000), currency: 'RWF',
    }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await approveTransaction('tx-1')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: true, isActivated: true }
      })
    )
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
    const mockTx = {
      id: 'tx-1', type: 'DEPOSIT', userId: 'u-1',
      amount: decimal(5), localAmount: null, currency: 'USD',
    }
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.protocolTransaction.update as any).mockResolvedValue({})
    ;(prisma.notification.create as any).mockResolvedValue({})

    await rejectTransaction('tx-1', 'Insufficient proof')
    expect(prisma.protocolTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
    )
    expect(prisma.notification.create).toHaveBeenCalled()
  })

  it('should throw if transaction not found', async () => {
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(null)
    await expect(rejectTransaction('bad-id', 'reason')).rejects.toThrow('Transaction not found')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Content Scheduling', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getAllQuizzes should return all quizzes with serialised reward', async () => {
    const mockQuizzes = [{ id: 'q1', title: 'Quiz 1', isActive: true, reward: decimal(0.5), questions: [] }]
    ;(prisma.quiz.findMany as any).mockResolvedValue(mockQuizzes)
    const result = await getAllQuizzes()
    expect(result[0].reward).toBe(0.5)
  })

  it('getAllVideos should return all videos with serialised reward', async () => {
    const mockVideos = [{ id: 'v1', title: 'Video 1', isActive: true, reward: decimal(0.2) }]
    ;(prisma.video.findMany as any).mockResolvedValue(mockVideos)
    const result = await getAllVideos()
    expect(result[0].reward).toBe(0.2)
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

  it('setDailySchedule should use default winning numbers when not provided', async () => {
    ;(prisma.dailySchedule.upsert as any).mockResolvedValue({})
    await setDailySchedule('2026-03-20', [], [])
    expect(prisma.dailySchedule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          t2000WinningNumbers: '[7, 77, 777]',
          t5000WinningNumbers: '[8, 88, 888]',
          t10000WinningNumbers: '[9, 99, 999]',
        }),
      })
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('Game Config', () => {
  beforeEach(() => { vi.clearAllMocks(); mockAdmin() })

  it('getGameConfig should return the singleton config', async () => {
    const mockConfig = {
      id: 'singleton',
      t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3,
      t2000NumberPool: [7, 77, 777],
      t5000NumberPool: [8, 88, 888],
      t10000NumberPool: [9, 99, 999],
    }
    ;(prisma.gameConfig.findUnique as any).mockResolvedValue(mockConfig)
    const result = await getGameConfig()
    expect(result).toEqual(mockConfig)
    expect(prisma.gameConfig.findUnique).toHaveBeenCalledWith({ where: { id: 'singleton' } })
  })

  it('updateGameConfig should upsert daily limits', async () => {
    ;(prisma.gameConfig.upsert as any).mockResolvedValue({})
    await updateGameConfig({ t2000DailyLimit: 5, t5000DailyLimit: 3, t10000DailyLimit: 2 })
    expect(prisma.gameConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'singleton' },
        update: expect.objectContaining({ t2000DailyLimit: 5 }),
      })
    )
  })

  it('updateGameConfig should upsert number pools', async () => {
    ;(prisma.gameConfig.upsert as any).mockResolvedValue({})
    await updateGameConfig({
      t2000NumberPool: [1, 2, 3],
      t5000NumberPool: [4, 5, 6],
      t10000NumberPool: [7, 8, 9],
    })
    expect(prisma.gameConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          t2000NumberPool: [1, 2, 3],
          t5000NumberPool: [4, 5, 6],
          t10000NumberPool: [7, 8, 9],
        }),
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

  it('getAllTickets without filter should use empty where', async () => {
    ;(prisma.supportTicket.findMany as any).mockResolvedValue([])
    await getAllTickets()
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
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
          senderId: 'admin-1',
          message: 'Hello, we are looking into this.',
        })
      })
    )
    expect(prisma.supportTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'IN_PROGRESS' })
      })
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