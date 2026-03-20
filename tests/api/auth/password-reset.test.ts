import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestPasswordReset, resetPassword } from '@/app/actions/authActions'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/mail'

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

vi.mock('@/lib/mail', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('bcryptjs', () => ({
  default: { 
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true)
  }
}))

describe('Password Reset Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestPasswordReset', () => {
    it('should generate a token and send an email if user exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await requestPasswordReset('test@example.com')

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalled()
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', expect.any(String))
    })

    it('should return success even if user does not exist (security)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null)

      const result = await requestPasswordReset('nonexistent@example.com')

      expect(result.success).toBe(true)
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should update password and clear token if valid', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await resetPassword('valid-token', 'new-password-123')

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'hashed-password',
          resetPasswordToken: null,
          resetPasswordExpiry: null
        }
      })
    })

    it('should fail if token is invalid or expired', async () => {
      (prisma.user.findFirst as any).mockResolvedValue(null)

      const result = await resetPassword('invalid-token', 'new-password-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired token')
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})
