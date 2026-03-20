import { getAllQuizzes } from '@/app/actions/adminActions'
import { QuizzesClient } from '@/components/admin/QuizzesClient'

export const dynamic = 'force-dynamic'

export default async function AdminQuizzesPage() {
  const quizzes = await getAllQuizzes()
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-(--text-primary)">Manage Quizzes</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">Create, edit, and delete system knowledge assessments.</p>
      </div>
      <QuizzesClient initialQuizzes={quizzes} />
    </div>
  )
}
