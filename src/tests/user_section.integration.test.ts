import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    protocolTransaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    supportTicket: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    supportMessage: {
      create: vi.fn(),
    },
    gamePlay: {
      count: vi.fn(),
      create: vi.fn(),
    },
    gameConfig: {
      findUnique: vi.fn(),
    },
    dailySchedule: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}))

// ── Mock next-auth ──────────────────────────────────────────────────────────
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({})),
  getServerSession: vi.fn(() =>
    Promise.resolve({ user: { id: 'test-user-id', role: 'USER' } })
  ),
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ── Mock currency lib ───────────────────────────────────────────────────────
// walletActions imports getCurrencyFromCountry, convertToUSD, formatCurrency, formatRaw.
// We use a 1:1 USD ratio so amount values in tests are predictable.
vi.mock('@/lib/currency', () => ({
  getCurrencyFromCountry: vi.fn(() => 'USD'),
  convertToUSD: vi.fn((amount: number) => amount), // 1:1 for tests
  formatCurrency: vi.fn((amount: number) => `$${amount}`),
  formatRaw: vi.fn((amount: number, currency: string) => `${currency} ${amount}`),
  COUNTRY_CURRENCY: {},
}))

// ── Mock dateUtils ──────────────────────────────────────────────────────────
vi.mock('@/lib/dateUtils', () => ({
  getTodayUTC: vi.fn(() => new Date('2026-03-22T00:00:00.000Z')),
}))

import prisma from '@/lib/prisma'
import { createTicket, getUserTickets, sendTicketMessage } from '@/app/actions/supportActions'
import { playGame } from '@/app/actions/gameActions'
import { requestWithdrawal } from '@/app/actions/walletActions'

// ── Shared test user ────────────────────────────────────────────────────────
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  country: 'US',
  mainBalance: 100,
  gameBalance: 50,
  isActive: true,
}

// ── Today's daily schedule with winning numbers ─────────────────────────────
const TODAY_SCHEDULE = {
  id: 'schedule-1',
  date: new Date('2026-03-22T00:00:00.000Z'),
  quizIds: [],
  videoIds: [],
  t2000WinningNumbers: '[7, 77, 777]',
  t5000WinningNumbers: '[8, 88, 888]',
  t10000WinningNumbers: '[9, 99, 999]',
}

// ═══════════════════════════════════════════════════════════════════════════
describe('User Section Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.user.findUnique as any).mockResolvedValue(TEST_USER)
    ;(prisma.user.update as any).mockResolvedValue(TEST_USER)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.notification.create as any).mockResolvedValue({})
    ;(prisma.protocolTransaction.create as any).mockResolvedValue({})
    ;(prisma.dailySchedule.findUnique as any).mockResolvedValue(TODAY_SCHEDULE)
  })

  // ── Support System ────────────────────────────────────────────────────────
  describe('Support System', () => {
    it('should create a support ticket with an initial message', async () => {
      const mockTicket = { id: 'ticket-1', subject: 'Test Subject', status: 'OPEN', messages: [] }
      ;(prisma.supportTicket.create as any).mockResolvedValue(mockTicket)
      ;(prisma.supportMessage.create as any).mockResolvedValue({})

      const result = await createTicket('Test Subject', 'Initial Message')
      expect(result.id).toBe('ticket-1')
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subject: 'Test Subject', userId: 'test-user-id' })
        })
      )
    })

    it('should send a message in an existing ticket', async () => {
      ;(prisma.supportMessage.create as any).mockResolvedValue({})
      ;(prisma.supportTicket.findUnique as any).mockResolvedValue({
        id: 'ticket-1', status: 'OPEN', userId: 'test-user-id'
      })

      await sendTicketMessage('ticket-1', 'M2')
      expect(prisma.supportMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ticketId: 'ticket-1', message: 'M2' })
        })
      )
    })
  })

  // ── Wallet & Transactions ─────────────────────────────────────────────────
  describe('Wallet & Transactions', () => {
    it('should prevent withdrawal below minimum limit ($1)', async () => {
      // 0.5 USD is below the $1 minimum — currency mock is 1:1 so convertToUSD(0.5) = 0.5
      await expect(requestWithdrawal(0.5, 'Mobile Money', '0780000000')).rejects.toThrow()
    })

    it('should prevent withdrawal above maximum limit ($100)', async () => {
      // 200 USD exceeds the $100 maximum
      await expect(requestWithdrawal(200, 'Mobile Money', '0780000000')).rejects.toThrow()
    })

    it('should prevent withdrawal if balance is insufficient', async () => {
      // User has $4 main balance, trying to withdraw $10
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, mainBalance: 4 })
      await expect(requestWithdrawal(10, 'Bank', '123456789')).rejects.toThrow()
    })

    it('should process a valid withdrawal and create a PENDING transaction', async () => {
      // $10 is within [$1, $100] and user has $100 balance
      const result = await requestWithdrawal(10, 'Crypto', '0x123...')
      expect(result.success).toBe(true)
      expect(prisma.protocolTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'WITHDRAWAL',
            status: 'PENDING',
            amount: 10,
            currency: 'USD',
          })
        })
      )
    })
  })

  // ── Game Logic ────────────────────────────────────────────────────────────
  describe('Game Logic', () => {
    it('should prevent playing if game balance is insufficient', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 0 })
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3,
      })
      ;(prisma.gamePlay.count as any).mockResolvedValue(0)
      await expect(playGame('T2000', '7')).rejects.toThrow()
    })

    it('should resolve as a WIN when picked number is in the winning pool', async () => {
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3,
      })
      ;(prisma.gamePlay.count as any).mockResolvedValue(0)
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 50 })
      ;(prisma.gamePlay.create as any).mockResolvedValue({})

      // T2000 winning numbers are [7, 77, 777] — pick 7 → WIN
      const result = await playGame('T2000', '7')
      expect(result).toHaveProperty('didWin')
      expect(result.didWin).toBe(true)
      expect(result.winnings).toBe(3.5)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should resolve as a LOSS when picked number is not in the winning pool', async () => {
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3,
      })
      ;(prisma.gamePlay.count as any).mockResolvedValue(0)
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 50 })
      ;(prisma.gamePlay.create as any).mockResolvedValue({})

      // T2000 winning numbers are [7, 77, 777] — pick 42 → LOSS
      const result = await playGame('T2000', '42')
      expect(result).toHaveProperty('didWin')
      expect(result.didWin).toBe(false)
      expect(result.winnings).toBe(0)
    })

    it('should throw when daily play limit is reached', async () => {
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3,
      })
      // User has already played 3 times today — at the limit
      ;(prisma.gamePlay.count as any).mockResolvedValue(3)
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 50 })

      await expect(playGame('T2000', '7')).rejects.toThrow()
    })
  })
})