'use server'

import prisma from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { sendPasswordResetEmail } from '@/lib/mail'

/**
 * Request a password reset.
 * Generates a token, saves it to the user, and sends an email.
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // For security reasons, don't reveal if a user exists
      return { success: true }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 3600000) // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: expiry
      }
    })

    await sendPasswordResetEmail(user.email, token)

    return { success: true }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { success: false, error: 'Failed to request password reset' }
  }
}

/**
 * Reset a user's password using a token.
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return { success: false, error: 'Invalid or expired token' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: 'Failed to reset password' }
  }
}

/**
 * Resend a verification email.
 */
export async function resendVerificationEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || user.isEmailVerified) {
      return { success: false, error: 'User not found or already verified' }
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verificationOTP,
        emailVerifyExpiry: expiry
      }
    })

    const { sendVerificationEmail } = await import('@/lib/mail')
    await sendVerificationEmail(email, verificationOTP)

    return { success: true }
  } catch (error) {
    console.error('Resend verification error:', error)
    return { success: false, error: 'Failed to resend verification email' }
  }
}
