import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import prisma from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') }
}))

describe('Register API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    // Mock db finds
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: '1' });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        country: 'US',
        phone: '1234567890'
      })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(prisma.user.create).toHaveBeenCalled()
  })

  it('should fail if email is already existing', async () => {
    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      if (args.where.email) return Promise.resolve({ id: '2' });
      return Promise.resolve(null);
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
        country: 'US'
      })
    })

    const response = await POST(req)
    expect(response.status).toBe(409)
  })
})
