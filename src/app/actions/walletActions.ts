'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

import { getCurrencyFromCountry, convertToUSD, formatCurrency, formatRaw } from '@/lib/currency'

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

async function saveProofImage(base64Data: string, userId: string) {
  if (!base64Data.startsWith('data:image/')) return base64Data

  // Extract MIME type from the data URI (e.g. "image/jpeg", "image/png")
  const mimeMatch = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,/)
  if (!mimeMatch) throw new Error('Invalid image data')

  const mimeType = mimeMatch[1]

  // Allowed upload formats — SVG is excluded for security reasons
  const ALLOWED: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  const ext = ALLOWED[mimeType]
  if (!ext) {
    throw new Error(
      `Unsupported file format: ${mimeType}. Please upload a JPEG, PNG, WebP, or GIF image.`
    )
  }

  const buffer = Buffer.from(base64Data.split(',')[1], 'base64')
  const fileName = `${userId}_${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  fs.writeFileSync(path.join(uploadDir, fileName), buffer)
  return `/uploads/proofs/${fileName}`
}

export async function getEarningsStats() {
  const user = await getAuthUser()
  const [dbUser, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { mainBalance: true, gameBalance: true, country: true, isActivated: true, isActive: true, username: true, email: true }
    }),
    prisma.protocolTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ])

  if (!dbUser) throw new Error('User not found')

  const stats = await prisma.protocolTransaction.aggregate({
    where: { userId: user.id, status: 'APPROVED' },
    _sum: { amount: true }
  })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentEarnings = await prisma.protocolTransaction.findMany({
    where: { userId: user.id, type: 'EARNING', status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
    select: { amount: true, createdAt: true }
  })

  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayEarnings = recentEarnings
      .filter(tx => tx.createdAt.toISOString().split('T')[0] === dateStr)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    chartData.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), earnings: dayEarnings })
  }

  const main = Number(dbUser.mainBalance)
  const game = Number(dbUser.gameBalance)

  return {
    balances: { main, game, total: main + game },
    totalEarned: Number(stats._sum.amount || 0),
    chartData,
    transactions: transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
      // localAmount: what the user originally entered in their local currency
      // Falls back to amount (USD) for old records or internal-only transactions
      localAmount: Number((tx as any).localAmount ?? tx.amount),
    })),
    country: dbUser.country,
    user: {
      isActivated: dbUser.isActivated,
      isActive: dbUser.isActive,
      username: dbUser.username,
      email: dbUser.email
    }
  }
}

export const getWalletData = getEarningsStats

/**
 * DEPOSIT: user enters amount in LOCAL currency (e.g. 5000 RWF).
 * Stored as:
 *   amount      = USD equivalent (used by approveTransaction to credit balance)
 *   localAmount = what the user typed (shown in history)
 *   currency    = their local currency code
 */
export async function initiateDeposit(localAmount: number, method: string, proofImage: string, reference: string) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { country: true } })
  const currency = getCurrencyFromCountry(dbUser?.country || 'US')
  const usdAmount = convertToUSD(localAmount, currency)
  const proofPath = await saveProofImage(proofImage, user.id)

  await (prisma.protocolTransaction as any).create({
    data: {
      userId: user.id,
      type: 'DEPOSIT',
      amount: usdAmount,
      currency,
      localAmount,
      paymentMethod: method,
      paymentReference: reference,
      proofImage: proofPath,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/wallet')
  return { success: true }
}

/**
 * WITHDRAWAL: user picks USD amount from their USD balance.
 */
export async function initiateWithdrawal(localAmount: number, method: string, address: string) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { mainBalance: true, country: true } })
  if (!dbUser) throw new Error('User not found')

  const currency = getCurrencyFromCountry(dbUser.country || 'US')
  const usdAmount = convertToUSD(localAmount, currency)

  if (usdAmount < 1) {
    throw new Error(`Minimum withdrawal is ${formatCurrency(1, currency)}.`)
  }
  if (usdAmount > 100) {
    throw new Error(`Maximum withdrawal is ${formatCurrency(100, currency)}.`)
  }
  if (Number(dbUser.mainBalance) < usdAmount) {
    throw new Error(`Insufficient balance. You have ${formatCurrency(Number(dbUser.mainBalance), currency)} available.`)
  }

  await (prisma.protocolTransaction as any).create({
    data: {
      userId: user.id,
      type: 'WITHDRAWAL',
      amount: usdAmount,      // USD — used by approveTransaction to deduct balance
      currency,               // user's local currency
      localAmount,            // what user entered, shown in history
      paymentMethod: method,
      paymentReference: address,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/transactions')
  return { success: true }
}

export const requestWithdrawal = initiateWithdrawal

/**
 * ACTIVATION: user pays in local currency.
 */
export async function activateAccountWithProof(method: string, reference: string, proofImage: string, localAmount: number) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { country: true } })
  const currency = getCurrencyFromCountry(dbUser?.country || 'US')
  const usdAmount = convertToUSD(localAmount, currency)

  await (prisma.protocolTransaction as any).create({
    data: {
      userId: user.id,
      type: 'ACTIVATION',
      amount: usdAmount,
      currency,
      localAmount,
      paymentMethod: method,
      paymentReference: reference,
      proofImage: proofImage,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/profile')
  return { success: true }
}

/**
 * GAME DEPOSIT: user pays in local currency.
 */
export async function gameDepositWithProof(localAmount: number, method: string, reference: string, proofImage: string) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { country: true } })
  const currency = getCurrencyFromCountry(dbUser?.country || 'US')
  const usdAmount = convertToUSD(localAmount, currency)
  const proofPath = await saveProofImage(proofImage, user.id)

  await (prisma.protocolTransaction as any).create({
    data: {
      userId: user.id,
      type: 'GAME_DEPOSIT',
      amount: usdAmount,
      currency,
      localAmount,
      paymentMethod: method,
      paymentReference: reference,
      proofImage: proofPath,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/games')
  return { success: true }
}

/**
 * TRANSFER: user enters amount in local currency.
 * Converted to USD for balance math, local amount kept for display.
 */
export async function transferToGameBalance(localAmount: number) {
  const user = await getAuthUser()
  if (localAmount <= 0) return { error: 'Invalid amount' }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { country: true } })
  const currency = getCurrencyFromCountry(dbUser?.country || 'US')
  const usdAmount = convertToUSD(localAmount, currency)

  try {
    return await prisma.$transaction(async (tx: any) => {
      const freshUser = await tx.user.findUnique({ where: { id: user.id } })
      if (!freshUser) throw new Error('User not found')
      if (Number(freshUser.mainBalance) < usdAmount) throw new Error('Insufficient main balance')

      await tx.user.update({
        where: { id: user.id },
        data: {
          mainBalance: { decrement: usdAmount },
          gameBalance: { increment: usdAmount }
        }
      })

      await tx.protocolTransaction.create({
        data: {
          userId: user.id,
          type: 'TRANSFER',
          amount: usdAmount,      // USD stored in balance
          currency,               // user's local currency
          localAmount,           // what they typed
          status: 'COMPLETED',
          notes: 'Internal Transfer: Main → Game Balance'
        }
      })

      return { success: true }
    })
  } catch (error: any) {
    return { error: error.message }
  } finally {
    revalidatePath('/')
    revalidatePath('/dashboard/wallet')
  }
}

export async function getPaymentMethods() {
  return await prisma.paymentMethod.findMany({ where: { isActive: true } })
}

export async function getUserTransactions() {
  const user = await getAuthUser()
  const transactions = await prisma.protocolTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })
  return transactions.map(tx => ({
    ...tx,
    amount: Number(tx.amount),
    localAmount: Number((tx as any).localAmount ?? tx.amount),
  }))
}

export const getAllTransactions = getUserTransactions