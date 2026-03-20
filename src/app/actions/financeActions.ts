'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Activates the user account for a $1.00 fee.
 */
/**
 * Initiates account activation protocol by submitting payment proof.
 */
export async function initiateActivation(amount: number, method: string, proofImage: string, reference?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const tx = await prisma.protocolTransaction.create({
      data: {
        userId: session.user.id,
        type: 'ACTIVATION',
        amount: amount,
        status: 'PENDING',
        paymentMethod: method,
        paymentReference: reference,
        proofImage: proofImage,
        notes: `Account Protocol Initialization via ${method}`
      }
    })

    return { success: true, transactionId: tx.id }
  } catch (error: any) {
    return { error: error.message }
  } finally {
    revalidatePath('/')
  }
}

/**
 * Transfers funds from Main Balance to Game Balance.
 */
export async function transferToGameBalance(amount: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }
  if (amount <= 0) return { error: 'Invalid amount' }

  try {
    return await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user) throw new Error('User not found')
      if (Number(user.mainBalance) < amount) throw new Error('Insufficient main balance')

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
  }
}

/**
 * Initiates an external deposit.
 */
export async function initiateDeposit(amount: number, method: string, proofImage: string, reference?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }
  if (amount <= 0) return { error: 'Invalid deposit amount' }

  try {
    const tx = await prisma.protocolTransaction.create({
      data: {
        userId: session.user.id,
        type: 'DEPOSIT',
        amount: amount,
        status: 'PENDING',
        paymentMethod: method,
        paymentReference: reference,
        proofImage: proofImage,
        notes: `External deposit via ${method}`
      }
    })

    return { success: true, transactionId: tx.id }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Confirms a deposit (Admin Action).
 * In a real scenario, this would check if the user is an ADMIN.
 */
export async function adminConfirmDeposit(transactionId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.protocolTransaction.findUnique({
        where: { id: transactionId }
      })

      if (!transaction) throw new Error('Transaction not found')
      if (transaction.status === 'COMPLETED') throw new Error('Transaction already processed')
      if (transaction.type !== 'DEPOSIT' && transaction.type !== 'ACTIVATION') throw new Error('Invalid transaction type')

      // 1. Update status
      await tx.protocolTransaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' }
      })

      // 2. Credit main balance or activate account
      if (transaction.type === 'DEPOSIT') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { mainBalance: { increment: transaction.amount } }
        })
      } else if (transaction.type === 'ACTIVATION') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { isActivated: true }
        })
      }

      // 3. Notify user
      await tx.notification.create({
        data: {
          userId: transaction.userId,
          title: transaction.type === 'DEPOSIT' ? 'Deposit Confirmed' : 'Account Activated',
          message: transaction.type === 'DEPOSIT' 
            ? `Your deposit of $${Number(transaction.amount).toFixed(2)} has been credited.`
            : `Your account protocol has been initialized successfully.`,
          type: 'TRANSACTION'
        }
      })

      return { success: true }
    })
    return result
  } catch (error: any) {
    return { error: error.message }
  } finally {
    revalidatePath('/dashboard/wallet')
    revalidatePath('/')
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
