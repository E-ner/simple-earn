'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

async function saveProofImage(base64Data: string, userId: string) {
  if (!base64Data.startsWith('data:image/')) return base64Data // Already a path or invalid

  const buffer = Buffer.from(base64Data.split(',')[1], 'base64')
  const fileName = `${userId}_${Date.now()}.png`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  
  const filePath = path.join(uploadDir, fileName)
  fs.writeFileSync(filePath, buffer)
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
      take: 10
    })
  ])

  if (!dbUser) throw new Error('User not found')

  const stats = await prisma.protocolTransaction.aggregate({
    where: { userId: user.id, status: 'APPROVED' },
    _sum: { amount: true }
  })

  // Generate 7-day chart data (mocked for now based on recent approved transactions)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    chartData.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      earnings: Math.random() * 2 // Mock yield
    })
  }

  // Group by main and game
  const main = Number(dbUser.mainBalance)
  const game = Number(dbUser.gameBalance)

  return {
    balances: {
      main,
      game,
      total: main + game
    },
    totalEarned: Number(stats._sum.amount || 0),
    chartData,
    transactions: transactions.map(tx => ({ ...tx, amount: Number(tx.amount) })),
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

export async function initiateDeposit(amount: number, method: string, proofImage: string, reference: string) {
  const user = await getAuthUser()
  const proofPath = await saveProofImage(proofImage, user.id)

  await prisma.protocolTransaction.create({
    data: {
      userId: user.id,
      type: 'DEPOSIT',
      amount: amount,
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


export async function initiateWithdrawal(amount: number, method: string, address: string) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  if (!dbUser || Number(dbUser.mainBalance) < amount) {
    throw new Error('Insufficient balance')
  }
  if (amount < 5) {
    throw new Error('Minimum withdrawal is $5')
  }

  await prisma.protocolTransaction.create({
    data: {
      userId: user.id,
      type: 'WITHDRAWAL',
      amount,
      paymentMethod: method,
      paymentReference: address,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/transactions')
  return { success: true }
}

export const requestWithdrawal = initiateWithdrawal


export async function activateAccountWithProof(method: string, reference: string, proofImage: string) {
  const user = await getAuthUser()
  
  await prisma.protocolTransaction.create({
    data: {
      userId: user.id,
      type: 'ACTIVATION',
      amount: 10.00, // Activation fee
      paymentMethod: method,
      paymentReference: reference,
      proofImage: proofImage,
      status: 'PENDING'
    }
  })

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function gameDepositWithProof(amount: number, method: string, reference: string, proofImage: string) {
  const user = await getAuthUser()
  const proofPath = await saveProofImage(proofImage, user.id)

  await prisma.protocolTransaction.create({
    data: {
      userId: user.id,
      type: 'GAME_DEPOSIT',
      amount,
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
 * Transfers funds from Main Balance to Game Balance.
 */
export async function transferToGameBalance(amount: number) {
  const user = await getAuthUser()
  if (amount <= 0) return { error: 'Invalid amount' }

  try {
    return await prisma.$transaction(async (tx: any) => {
      const dbUser = await tx.user.findUnique({
        where: { id: user.id }
      })

      if (!dbUser) throw new Error('User not found')
      if (Number(dbUser.mainBalance) < amount) throw new Error('Insufficient main balance')

      // Update balances
      await tx.user.update({
        where: { id: user.id },
        data: {
          mainBalance: { decrement: amount },
          gameBalance: { increment: amount }
        }
      })

      // Record transaction
      await tx.protocolTransaction.create({
        data: {
          userId: user.id,
          type: 'TRANSFER',
          amount: amount,
          status: 'COMPLETED',
          notes: 'Internal Transfer: Main to Game Balance'
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

/**
 * Fetches active payment methods.
 */
export async function getPaymentMethods() {
  return await prisma.paymentMethod.findMany({
    where: { isActive: true }
  })
}
/**
 * Fetches all transactions for the authenticated user.
 */
export async function getUserTransactions() {
  const user = await getAuthUser()
  const transactions = await prisma.protocolTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })
  return transactions.map(tx => ({ ...tx, amount: Number(tx.amount) }))
}

export const getAllTransactions = getUserTransactions
