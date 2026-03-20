import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateDeposit, adminConfirmDeposit } from '../app/actions/financeActions'
import prisma from '../lib/prisma'
import { getServerSession } from 'next-auth'

const { mockPrisma } = vi.hoisted(() => {
  const m: any = {
    protocolTransaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  m.$transaction.mockImplementation(async (cb: any) => await cb(m))
  return { mockPrisma: m }
})

vi.mock('../lib/prisma', () => ({
  default: mockPrisma,
}))

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Deposit System', () => {
  const mockUser = { id: 'user-1', mainBalance: 10.0 }
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('should successfully initiate a deposit', async () => {
    ;(prisma.protocolTransaction.create as any).mockResolvedValue({ id: 'tx-1' })

    const result = await initiateDeposit(50.0, 'MOBILE_MONEY', 'proofs/test.jpg', 'REF123')
    
    expect(result).toEqual({ success: true, transactionId: 'tx-1' })
    expect(prisma.protocolTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'DEPOSIT',
        amount: 50.0,
        status: 'PENDING',
        paymentMethod: 'MOBILE_MONEY',
        paymentReference: 'REF123',
      })
    })
  })

  it('should fail initiation if amount is invalid', async () => {
    const result = await initiateDeposit(-10, 'BANK', '')
    expect('error' in result ? result.error : undefined).toBeDefined()
  })

  it('should successfully confirm a deposit by admin', async () => {
    const mockTx = {
      id: 'tx-1',
      userId: 'user-1',
      amount: 50.0,
      status: 'PENDING',
      type: 'DEPOSIT'
    }

    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue(mockTx)
    
    const result = await adminConfirmDeposit('tx-1')
    
    expect(result.success).toBe(true)
    expect(prisma.protocolTransaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: { status: 'COMPLETED' }
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { mainBalance: { increment: 50.0 } }
    })
  })

  it('should fail if transaction is already completed', async () => {
    ;(prisma.protocolTransaction.findUnique as any).mockResolvedValue({
      id: 'tx-1',
      status: 'COMPLETED'
    })

    const result = await adminConfirmDeposit('tx-1')
    expect('error' in result ? result.error : undefined).toBe('Transaction already processed')
  })
})
