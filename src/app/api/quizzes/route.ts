import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Only get active quizzes
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        questions: {
          select: { id: true, question: true, options: true, order: true }
        }
      }
    })

    // Check which ones the user has already attempted today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Using simple approach without composite scheduledDate checks for now
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: {
          gte: today
        }
      }
    })

    const attemptedQuizIds = new Set(attempts.map((a: { quizId: string }) => a.quizId))

    // Mask the correctIndex from the user so they can't cheat via devtools
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
