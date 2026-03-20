import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code } = body
    
    if (!email || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: "Email already verified", success: true }, { status: 200 })
    }

    if (user.emailVerifyToken !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    if (user.emailVerifyExpiry && new Date() > new Date(user.emailVerifyExpiry)) {
      return NextResponse.json({ error: "Verification code expired" }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        isActive: true, // Assuming email verification activates user
        emailVerifyToken: null,
        emailVerifyExpiry: null
      }
    })

    return NextResponse.json({ message: "Email successfully verified", success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
