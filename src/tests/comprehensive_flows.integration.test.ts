import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Prisma ─────────────────────────────────────────────────────────────
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    protocolTransaction: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    quiz: { findUnique: vi.fn() },
    quizAttempt: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    video: { findUnique: vi.fn() },
    videoWatch: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    supportTicket: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    supportMessage: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((fn) => fn(prismaMock)),
  }
}))

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}))

import prisma from '@/lib/prisma'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn()
}))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }))
import { getServerSession } from 'next-auth/next'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ── Actions & Routes ────────────────────────────────────────────────────────
import { initiateActivation } from '@/app/actions/financeActions'
import { approveTransaction, replyToTicket } from '@/app/actions/adminActions'
import { createTicket, getUserTickets } from '@/app/actions/supportActions'
import { POST as quizPOST } from '@/app/api/quizzes/[id]/attempt/route'
import { POST as videoPOST } from '@/app/api/videos/[id]/watch/route'

// ── Test Constants ──────────────────────────────────────────────────────────
const USER_ID = 'user-123'
const ADMIN_ID = 'admin-456'
const TEST_USER = { id: USER_ID, email: 'user@test.com', role: 'USER', mainBalance: 0, isActive: false, isActivated: false }
const TEST_ADMIN = { id: ADMIN_ID, email: 'admin@test.com', role: 'ADMIN' }

// ═══════════════════════════════════════════════════════════════════════════

describe('Comprehensive Platform Integration Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock))
  })

  // ── 1. Activation Cycle ───────────────────────────────────────────────────
  describe('Activation Cycle (User -> Admin -> User)', () => {
    it('should drive a user from INACTIVE to ACTIVE through payment proof', async () => {
      // 1. User initiates activation
      ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID, role: 'USER' } })
      prismaMock.protocolTransaction.create.mockResolvedValue({ id: 'tx-act-1' })

      const initRes = await initiateActivation(1, 'M-PESA', 'proof.jpg', 'REF123')
      expect(initRes.success).toBe(true)
      expect(prismaMock.protocolTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ type: 'ACTIVATION', status: 'PENDING' })
      }))

      // 2. Admin approves the activation
      ;(getServerSession as any).mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } })
      prismaMock.protocolTransaction.findUnique.mockResolvedValue({ id: 'tx-act-1', userId: USER_ID, type: 'ACTIVATION', amount: 1 })
      
      await approveTransaction('tx-act-1')

      // Verify User is now active
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: USER_ID },
        data: expect.objectContaining({ isActive: true, isActivated: true })
      }))
    })
  })

  // ── 2. Earning Cycle (Quiz & Video) ───────────────────────────────────────
  describe('Earning Cycle (Quiz & Video)', () => {
    it('should credit user balance upon passing a quiz', async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID } })
      
      const mockQuiz = { id: 'quiz-1', reward: 5, questions: [{ id: 'q1', correctIndex: 0 }] }
      prismaMock.quiz.findUnique.mockResolvedValue(mockQuiz)
      prismaMock.quizAttempt.findFirst.mockResolvedValue(null) // Not attempted today
      prismaMock.quizAttempt.create.mockResolvedValue({ earnedAmount: 5 })

      const req = new Request('http://localhost/api/quizzes/quiz-1/attempt', {
        method: 'POST',
        body: JSON.stringify({ answers: [{ questionId: 'q1', selectedIndex: 0 }] })
      })
      
      const res = await quizPOST(req, { params: Promise.resolve({ id: 'quiz-1' }) })
      const data = await res.json()
      
      expect(data).toMatchObject({ success: true, passed: true })
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: USER_ID },
        data: { mainBalance: { increment: 5 } }
      }))
    })

    it('should credit user balance upon watching a video', async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID } })
      
      const mockVideo = { id: 'vid-1', reward: 2, duration: 30 }
      prismaMock.video.findUnique.mockResolvedValue(mockVideo)
      prismaMock.videoWatch.findFirst.mockResolvedValue(null)
      
      const req = new Request('http://localhost/api/videos/vid-1/watch', {
        method: 'POST',
        body: JSON.stringify({ watchDurationSeconds: 30, verificationCode: 'SECRET' })
      })
      
      const res = await videoPOST(req, { params: Promise.resolve({ id: 'vid-1' }) })
      const data = await res.json()
      if (!data.success) console.error('Video Watch Submit Error Data:', data)

      expect(data).toMatchObject({ success: true })
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: USER_ID },
        data: { mainBalance: { increment: 2 } }
      }))
    })
  })

  // ── 3. Support Cycle (User <-> Admin) ─────────────────────────────────────
  describe('Support Cycle (User <-> Admin)', () => {
    it('should handle a multi-turn support conversation', async () => {
      // 1. User creates ticket
      ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID, role: 'USER' } })
      prismaMock.supportTicket.create.mockResolvedValue({ id: 'tkt-1' })
      
      await createTicket('Problem', 'I need help')
      expect(prismaMock.supportTicket.create).toHaveBeenCalled()

      // 2. Admin replies
      ;(getServerSession as any).mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } })
      
      await replyToTicket('tkt-1', 'I am here to help')
      expect(prismaMock.supportMessage.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ticketId: 'tkt-1', senderId: ADMIN_ID, message: 'I am here to help' })
      }))

      // 3. User views tickets (check it includes messages)
      ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID, role: 'USER' } })
      prismaMock.supportTicket.findMany.mockResolvedValue([
        { id: 'tkt-1', subject: 'Problem', messages: [{ message: 'I am here to help' }] }
      ])
      
      const tickets = await getUserTickets()
      expect(tickets[0].messages[0].message).toBe('I am here to help')
    })
  })
})
