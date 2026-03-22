import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth"
import prisma from '@/lib/prisma'
import { getTodayUTC } from '@/lib/dateconfig'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = getTodayUTC()

    const schedule = await prisma.dailySchedule.findUnique({
      where: { date: today }
    })

    if (!schedule || !Array.isArray(schedule.quizIds) || schedule.quizIds.length === 0) {
      return NextResponse.json({ quizzes: [] })
    }

    const scheduledQuizIds = schedule.quizIds as string[]

    const quizzes = await prisma.quiz.findMany({
      where: {
        id: { in: scheduledQuizIds },
        isActive: true
      },
      include: {
        questions: {
          select: { id: true, question: true, options: true, order: true }
        }
      }
    })

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: { gte: today }
      }
    })

    const attemptedQuizIds = new Set(attempts.map((a: { quizId: string }) => a.quizId))

    const safeQuizzes = quizzes.map((quiz: any) => ({
      ...quiz,
      questions: quiz.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        order: q.order
      })),
      isCompletedToday: attemptedQuizIds.has(quiz.id)
    }))

    return NextResponse.json({ quizzes: safeQuizzes })
  } catch (error) {
    console.error('Fetch Quizzes Error:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}