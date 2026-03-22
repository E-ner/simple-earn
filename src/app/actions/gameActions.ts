'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getTodayUTC } from '@/lib/dateconfig'

export type GameType = 'T2000' | 'T5000' | 'T10000'

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

export async function getGameStats() {
  const user = await getAuthUser()
  const today = getTodayUTC()

  const [dbUser, recentPlays, schedule] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { gameBalance: true, country: true } }),
    prisma.gamePlay.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.dailySchedule.findUnique({ where: { date: today } }) as any
  ])

  return {
    gameBalance: Number(dbUser?.gameBalance || 0),
    country: dbUser?.country || 'US',
    recentPlays: recentPlays.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      winnings: Number(p.winnings)
    })),
    scheduledTiers: {
      T2000: !!schedule?.t2000WinningNumbers,
      T5000: !!schedule?.t5000WinningNumbers,
      T10000: !!schedule?.t10000WinningNumbers
    }
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
    throw new Error('Your gaming fuel is empty! Transfer funds from your main balance to continue the protocol.')
  }

  const today = getTodayUTC()

  const schedule = await prisma.dailySchedule.findUnique({
    where: { date: today }
  }) as any

  if (!schedule) {
    throw new Error('This terminal has no active game protocols for today. Check back during the next scheduled cycle.')
  }

  const gameConfig = await prisma.gameConfig.findUnique({ where: { id: 'singleton' } })
  if (!gameConfig) throw new Error('System configuration error')

  const playedToday = await prisma.gamePlay.count({
    where: { userId: user.id, gameType: tier, createdAt: { gte: today } }
  })

  let limit = 0
  if (tier === 'T2000') limit = gameConfig.t2000DailyLimit
  else if (tier === 'T5000') limit = gameConfig.t5000DailyLimit
  else if (tier === 'T10000') limit = gameConfig.t10000DailyLimit

  if (playedToday >= limit) {
    throw new Error(`Daily protocol limit reached for ${tier}. Maximum ${limit} attempts allowed per cycle. Reset occurs at next terminal sync.`)
  }

  let winningPool: number[] = []
  if (tier === 'T2000' && schedule.t2000WinningNumbers) winningPool = JSON.parse(schedule.t2000WinningNumbers as string)
  else if (tier === 'T5000' && schedule.t5000WinningNumbers) winningPool = JSON.parse(schedule.t5000WinningNumbers as string)
  else if (tier === 'T10000' && schedule.t10000WinningNumbers) winningPool = JSON.parse(schedule.t10000WinningNumbers as string)

  if (winningPool.length === 0) {
    throw new Error('Game logic not initialized for today. Contact synchronization support.')
  }

  const pickedNum = parseInt(tokenPicked)
  const didWin = winningPool.includes(pickedNum)
  const winnings = didWin ? win : 0

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { gameBalance: { increment: winnings - cost } }
    })
    await tx.gamePlay.create({
      data: {
        userId: user.id,
        gameType: tier,
        tokenPicked,
        winToken: winningPool[0].toString(),
        winNumbers: winningPool,
        didWin,
        amount: cost,
        winnings
      }
    })
  })

  revalidatePath('/dashboard/games')
  return { didWin, winToken: winningPool[0].toString(), winnings }
}