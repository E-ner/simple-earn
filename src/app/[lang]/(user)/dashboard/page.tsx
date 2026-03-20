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
  const [user, quizStats, videoStats, walletStats] = await Promise.all([
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
    // Quiz stats for today
    (async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const total = await prisma.quiz.count({ where: { isActive: true } })
      const completed = await prisma.quizAttempt.count({
        where: {
          userId,
          completedAt: { gte: today }
        }
      })
      const pendingReward = (total - completed) * 0.20 // Assuming standard reward
      return { completed, total, pendingReward }
    })(),
    // Video stats for today
    (async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const total = await prisma.video.count({ where: { isActive: true } })
      const watched = await prisma.videoWatch.count({
        where: {
          userId,
          watchedAt: { gte: today }
        }
      })
      const maxReward = (total - watched) * 0.50 // Mocking reward calculation
      return { watched, total, maxReward }
    })(),
    getEarningsStats() as any
  ])

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
