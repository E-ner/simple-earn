'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type GameType = 'T2000' | 'T5000' | 'T10000'

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

export async function getGameStats() {
  const user = await getAuthUser()
  const [dbUser, recentPlays] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { gameBalance: true, country: true } }),
    prisma.gamePlay.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  return {
    gameBalance: Number(dbUser?.gameBalance || 0),
    country: dbUser?.country || 'US',
    recentPlays: recentPlays.map(p => ({
      ...p,
      amount: Number(p.amount),
      winnings: Number(p.winnings)
    }))
  }
}

export async function playGame(tier: GameType, tokenPicked: string) {
  const user = await getAuthUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  if (!dbUser) throw new Error('User not found')
  
  const config = {
    T2000: { cost: 2.00, win: 3.50 },
    T5000: { cost: 5.00, win: 9.00 },
    T10000: { cost: 10.00, win: 18.00 }
  }

  const { cost, win } = config[tier]

  if (Number(dbUser.gameBalance) < cost) {
    throw new Error('Insufficient game balance')
  }

  // Generate random win token 1-5
  const winToken = Math.floor(Math.random() * 5 + 1).toString()
  const didWin = tokenPicked === winToken
  const winnings = didWin ? win : 0

  await prisma.$transaction(async (tx) => {
    // Deduct cost and add winnings
    await tx.user.update({
      where: { id: user.id },
      data: {
        gameBalance: {
          decrement: cost,
          increment: winnings
        }
      }
    })

    // Record play
    await tx.gamePlay.create({
      data: {
        userId: user.id,
        gameType: tier,
        tokenPicked,
        winToken,
        didWin,
        amount: cost,
        winnings: winnings
      }
    })
  })

  revalidatePath('/dashboard/games')
  return { didWin, winToken, winnings }
}
