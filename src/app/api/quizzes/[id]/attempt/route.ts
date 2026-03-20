import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { apiLimiter } from '@/lib/rateLimit'

const attemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedIndex: z.number()
  }))
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 20 quiz requests per minute per user
    const { success: allowed } = apiLimiter.check(20, `quiz:${session.user.id}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }


    const userId = session.user.id
    console.log('Quiz POST UserId:', userId)
    const body = await request.json()
    console.log('Quiz POST Body:', body)
    const { answers } = attemptSchema.parse(body)

    // Verify Quiz Details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isActive: true },
      include: { questions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if already attempted today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        completedAt: { gte: today }
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: 'Already completed this quiz today' }, { status: 400 })
    }

    // Global daily quiz limit: 4 quizzes per day
    const totalAttemptsToday = await prisma.quizAttempt.count({
      where: {
        userId,
        completedAt: { gte: today }
      }
    })

    if (totalAttemptsToday >= 4) {
      return NextResponse.json({ error: 'Daily quiz limit reached (4 per day). Come back tomorrow!' }, { status: 400 })
    }

    // Grade the quiz securely on server
    let correctCount = 0
    
    for (const answer of answers) {
      const question = quiz.questions.find((q: any) => q.id === answer.questionId)
      if (question && question.correctIndex === answer.selectedIndex) {
        correctCount++
      }
    }

    // Assuming passing score is 100% for full reward, or we scale it.
    // Let's implement strict pass (all correct = true)
    const passed = correctCount === quiz.questions.length
    const earnedAmount = passed ? quiz.reward : 0

    // Database updates in a Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Attempt Record
      const attemptDate = new Date()
      // Use attemptDate for scheduledDate simulation for now to satisfy schema
      
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId,
          score: correctCount,
          passed,
          earnedAmount,
          scheduledDate: attemptDate 
        }
      })

      // 2. Award User main balance and Transaction log if passed
      if (passed && Number(earnedAmount) > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { mainBalance: { increment: earnedAmount } }
        })

        await tx.protocolTransaction.create({
          data: {
            userId,
            type: 'EARNING',
            amount: earnedAmount,
            status: 'COMPLETED',
            notes: `Quiz Reward: ${quiz.title}`
          }
        })
      }

      return attempt
    })

    return NextResponse.json({ 
      success: true, 
      passed, 
      score: correctCount,
      totalQuestions: quiz.questions.length,
      earnedAmount: result.earnedAmount 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Quiz Submit Error:', error)
    return NextResponse.json({ error: 'Failed to process quiz submission', details: (error as any).message }, { status: 500 })
  }
}
