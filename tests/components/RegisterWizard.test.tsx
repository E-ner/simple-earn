import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterWizard from '@/app/[lang]/register/page'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock fetch globally for testing
global.fetch = vi.fn()

describe('RegisterWizard', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('renders step 1 initially', () => {
    render(<RegisterWizard />)
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument()
  })

  it('validates email on step 1', () => {
    render(<RegisterWizard />)
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'invalid-email' } })
    fireEvent.click(screen.getByTestId('next-btn-1'))
    
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email.')
  })

  it('goes to step 2 when email is valid', () => {
    render(<RegisterWizard />)
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByTestId('next-btn-1'))
    
    expect(screen.getByText('Choose your details')).toBeInTheDocument()
  })

  it('goes through the entire flow and submits registration', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<RegisterWizard />)
    
    // Step 1
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByTestId('next-btn-1'))
    
    // Step 2
    fireEvent.change(screen.getByPlaceholderText('creative_name'), { target: { value: 'testuser' } })
    const pwInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwInputs[0], { target: { value: 'password123' } })
    fireEvent.change(pwInputs[1], { target: { value: 'password123' } })
    fireEvent.click(screen.getByTestId('next-btn-2'))
    
    // Step 3
    expect(screen.getByText('Where are you from?')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('+1 (555) 000-0000'), { target: { value: '1234567890' } })
    fireEvent.click(screen.getByTestId('submit-register'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.anything())
      // Check if it reached step 4
      expect(screen.getByText('Verify your email')).toBeInTheDocument()
    })
  })

  it('handles OTP verification', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<RegisterWizard />)
    
    // Manually push to step 4 by manipulating state/DOM logic
    fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByTestId('next-btn-1'))
    
    const pwInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwInputs[0], { target: { value: 'password123' } })
    fireEvent.change(pwInputs[1], { target: { value: 'password123' } })
    fireEvent.click(screen.getByTestId('next-btn-2'))
    
    // Auto mock the register api for step 3
    fireEvent.click(screen.getByTestId('submit-register'))

    await waitFor(() => expect(screen.getByText('Verify your email')).toBeInTheDocument())

    // Mock OTP verification response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Step 4
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('submit-otp'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })
})
