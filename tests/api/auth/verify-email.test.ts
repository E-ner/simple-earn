import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/auth/verify-email/route'
import prisma from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

describe('Verify Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should verify email successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isEmailVerified: false,
      emailVerifyToken: '123456',
      emailVerifyExpiry: new Date(Date.now() + 100000) // Future date
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.user.update as any).mockResolvedValue({ ...mockUser, isEmailVerified: true });

    const req = new Request('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        code: '123456'
      })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('should fail if token is invalid', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isEmailVerified: false,
      emailVerifyToken: '123456',
      emailVerifyExpiry: new Date(Date.now() + 100000)
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const req = new Request('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        code: 'wrong-code'
      })
    })

    const response = await POST(req)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid verification code')
  })
})
