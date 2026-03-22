import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { format } from "date-fns"
import DashboardContent from "@/components/dashboard/DashboardContent"
import { getEarningsStats } from "@/app/actions/walletActions"

// Define a type for the transaction data, including the added dateFormatted field
type TransactionWithFormattedDate = any & { dateFormatted: string };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) return null

  // Fetch all necessary data in parallel
  const [user, schedule, walletStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { 
        mainBalance: true, 
        gameBalance: true, 
        country: true,
        isActive: true,
        isActivated: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    }),
    (async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return prisma.dailySchedule.findUnique({ where: { date: today } })
    })(),
    getEarningsStats() as any
  ])

  // Process Stats based on schedule
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [quizAttempts, videoWatches] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId, completedAt: { gte: today } } }),
    prisma.videoWatch.count({ where: { userId, watchedAt: { gte: today } } })
  ])

  const quizTotal = (schedule?.quizIds as string[])?.length || 4
  const videoTotal = (schedule?.videoIds as string[])?.length || 2

  const quizStats = {
    completed: quizAttempts,
    total: quizTotal,
    pendingReward: Math.max(0, quizTotal - quizAttempts) * 0.50 
  }

  const videoStats = {
    watched: videoWatches,
    total: videoTotal,
    maxReward: Math.max(0, videoTotal - videoWatches) * 0.20
  }
  const { chartData: actualChartData, totalEarned: reconciledTotalEarned, user: walletUser } = walletStats

  // Compute Total Earned from all-time EARNING and GAME_WIN transactions
  // Using findMany as a more reliable accessor if aggregate is being flaky on renamed models
  const allEarnedTxs = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      transactions: {
        where: {
          type: { in: ['EARNING', 'GAME_WIN'] },
          status: 'COMPLETED'
        },
        select: { amount: true }
      }
    }
  })
  
  const totalEarned = allEarnedTxs?.transactions.reduce((acc: number, tx: any) => acc + Number(tx.amount), 0) || 0
  const dashboardTransactions = user?.transactions || []

  // Format transactions for UI
  const formattedTransactions: TransactionWithFormattedDate[] = dashboardTransactions.map((tx: any) => ({
    ...tx,
    amount: Number(tx.amount),
    dateFormatted: format(new Date(tx.createdAt), 'MMM dd, p')
  }))

  return (
    <DashboardContent 
      user={{
        ...user,
        mainBalance: Number(user?.mainBalance || 0),
        gameBalance: Number(user?.gameBalance || 0),
        transactions: formattedTransactions
      }}
      quizStats={quizStats}
      videoStats={videoStats}
      totalEarned={totalEarned}
      transactions={formattedTransactions}
      chartData={actualChartData}
    />
  )
}
