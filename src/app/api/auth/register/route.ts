import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/schemas'
import bcrypt from 'bcryptjs'
import { authLimiter, getClientIp } from '@/lib/rateLimit'

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const ip = getClientIp(req)
    const { success: allowed } = authLimiter.check(5, `register:${ip}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, username, password, country, phone } = registerSchema.parse(body)

    // Basic disposable email check
    const disposableDomains = ['mailinator.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com', 'sharklasers.com', 'dispostable.com'];
    const emailDomain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json({ error: "Disposable email addresses are not allowed. Please use a real email." }, { status: 400 })
    }

    const existingUserByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingUserByEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const existingUserByUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUserByUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString() // Generate 6-digit OTP

    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        country,
        phone,
        mainBalance: 1.00, // Initial Registration Bonus
        emailVerifyToken: verificationOTP,
        emailVerifyExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry
      }
    })

    // Create a transaction record for the registration bonus
    const newUser = await prisma.user.findUnique({ where: { email } });
    if (newUser) {
      await prisma.protocolTransaction.create({
        data: {
          userId: newUser.id,
          amount: 1.00,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          paymentMethod: 'SYSTEM_BONUS',
          paymentReference: 'REGISTRATION_BONUS'
        }
      });
    }

    // Import the mail utility dynamically (or at the top)
    const { sendVerificationEmail } = await import('@/lib/mail');
    await sendVerificationEmail(email, verificationOTP);

    return NextResponse.json({ message: "User registered. Please check your email for the verification code.", success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 })
  }
}
