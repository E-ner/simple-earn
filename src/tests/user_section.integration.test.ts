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
      update: vi.fn(),           // used by sendTicketMessage
    },
    supportMessage: {
      create: vi.fn(),
    },
    gamePlay: {
      count: vi.fn(),
      create: vi.fn(),           // used inside $transaction by playGame
    },
    gameConfig: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
    notification: {
      create: vi.fn(),
    }
  }
}))

// ── Mock next-auth ──────────────────────────────────────────────────────────
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({})),
  getServerSession: vi.fn(() => Promise.resolve({ user: { id: 'test-user-id', role: 'USER' } }))
}))

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import prisma from '@/lib/prisma'
import { createTicket, getUserTickets, sendTicketMessage } from '@/app/actions/supportActions'
import { playGame } from '@/app/actions/gameActions'
import { requestWithdrawal } from '@/app/actions/walletActions'

// ── Shared test user ────────────────────────────────────────────────────────
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  mainBalance: 100,
  gameBalance: 50,
  isActive: true,
}

// ═══════════════════════════════════════════════════════════════════════════
describe('User Section Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: user exists with balance
    ;(prisma.user.findUnique as any).mockResolvedValue(TEST_USER)
    ;(prisma.user.update as any).mockResolvedValue(TEST_USER)
    ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma))
    ;(prisma.notification.create as any).mockResolvedValue({})
    ;(prisma.protocolTransaction.create as any).mockResolvedValue({})
  })

  // ── Support System ────────────────────────────────────────────────────────
  describe('Support System', () => {
    it('should create a support ticket with an initial message', async () => {
      const mockTicket = { id: 'ticket-1', subject: 'Test Subject', status: 'OPEN', messages: [] }
      ;(prisma.supportTicket.create as any).mockResolvedValue(mockTicket)
      ;(prisma.supportMessage.create as any).mockResolvedValue({})

      const result = await createTicket('Test Subject', 'Initial Message')
      expect(result.success).toBe(true)
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

      const result = await sendTicketMessage('ticket-1', 'M2')
      expect(result.success).toBe(true)
      expect(prisma.supportMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ticketId: 'ticket-1', message: 'M2' })
        })
      )
    })
  })

  // ── Wallet & Transactions ─────────────────────────────────────────────────
  describe('Wallet & Transactions', () => {
    it('should prevent withdrawal below minimum limit ($5)', async () => {
      await expect(requestWithdrawal(2, 'Mobile Money')).rejects.toThrow()
    })

    it('should prevent withdrawal if balance is insufficient', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, mainBalance: 4 })
      await expect(requestWithdrawal(200, 'Bank')).rejects.toThrow()
    })

    it('should process a valid withdrawal and create a PENDING transaction', async () => {
      const result = await requestWithdrawal(10, 'Crypto')
      expect(result.success).toBe(true)
      // Should have created a protocol transaction
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  // ── Game Logic ────────────────────────────────────────────────────────────
  describe('Game Logic', () => {
    it('should prevent playing if game balance is insufficient', async () => {
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 0 })
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000WinToken: 'A', t2000DailyLimit: 3
      })
      ;(prisma.gamePlay.count as any).mockResolvedValue(0)
      await expect(playGame('T2000', 'A')).rejects.toThrow()
    })

    it('should process a game play and resolve with a win/loss result', async () => {
      ;(prisma.gameConfig.findUnique as any).mockResolvedValue({
        id: 'singleton', t2000WinToken: 'A', t5000WinToken: 'B', t10000WinToken: 'C',
        t2000DailyLimit: 3, t5000DailyLimit: 3, t10000DailyLimit: 3
      })
      ;(prisma.gamePlay.count as any).mockResolvedValue(0)
      ;(prisma.user.findUnique as any).mockResolvedValue({ ...TEST_USER, gameBalance: 50 })

      const result = await playGame('T2000', 'A') // picking A, win token is A → win
      expect(result).toHaveProperty('didWin')
      expect(result.didWin).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
