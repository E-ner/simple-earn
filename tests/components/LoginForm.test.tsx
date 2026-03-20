import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/[lang]/login/page'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /log in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Assuming zod messages are default
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })
  })

  it('calls signIn with correct credentials on submit', async () => {
    ;(signIn as any).mockResolvedValue({ error: null, ok: true })
    render(<LoginPage />)
    
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockPush).toHaveBeenCalledWith('/en/dashboard')
    })
  })

  it('displays error message when signIn fails', async () => {
    ;(signIn as any).mockResolvedValue({ error: 'CredentialsSignin' })
    render(<LoginPage />)
    
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    })
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
