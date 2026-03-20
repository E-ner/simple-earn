'use client'
import { useState, useTransition } from 'react'
import { Trash2, HelpCircle } from 'lucide-react'
import { adminCreateQuiz, adminDeleteQuiz } from '@/app/actions/adminActions'

interface Quiz { id: string, title: string, reward: any, questions: any[] }

export function QuizzesClient({ initialQuizzes }: { initialQuizzes: Quiz[] }) {
  const [isPending, startTransition] = useTransition()
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [quizForm, setQuizForm] = useState({ title: '', reward: 0.50, question: '', opt1: '', opt2: '', opt3: '', opt4: '', correct: 0 })

  const handleCreateQuiz = () => {
    startTransition(async () => {
      const questions = [{
        question: quizForm.question,
        options: [quizForm.opt1, quizForm.opt2, quizForm.opt3, quizForm.opt4].filter(Boolean),
        correctIndex: Number(quizForm.correct)
      }]
      await adminCreateQuiz({ title: quizForm.title, reward: quizForm.reward }, questions)
      setShowQuizForm(false)
      setQuizForm({ title: '', reward: 0.50, question: '', opt1: '', opt2: '', opt3: '', opt4: '', correct: 0 })
    })
  }

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Delete this quiz permanently?')) {
      startTransition(async () => await adminDeleteQuiz(id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Quiz Library</h2>
        <button onClick={() => setShowQuizForm(!showQuizForm)} 
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold hover:opacity-90">
          <HelpCircle className="w-4 h-4" /> {showQuizForm ? 'Cancel' : 'Create Quiz'}
        </button>
      </div>

      {showQuizForm && (
        <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase">Create New Quiz</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Quiz Title" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="number" step="0.01" placeholder="Reward Ex: 0.50" value={quizForm.reward} onChange={e => setQuizForm({...quizForm, reward: Number(e.target.value)})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="text" placeholder="Question Text" value={quizForm.question} onChange={e => setQuizForm({...quizForm, question: e.target.value})} className="col-span-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="text" placeholder="Option 1" value={quizForm.opt1} onChange={e => setQuizForm({...quizForm, opt1: e.target.value})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="text" placeholder="Option 2" value={quizForm.opt2} onChange={e => setQuizForm({...quizForm, opt2: e.target.value})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="text" placeholder="Option 3" value={quizForm.opt3} onChange={e => setQuizForm({...quizForm, opt3: e.target.value})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <input type="text" placeholder="Option 4" value={quizForm.opt4} onChange={e => setQuizForm({...quizForm, opt4: e.target.value})} className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)]" />
            <div className="col-span-2 mt-2">
              <label className="text-xs text-[var(--text-tertiary)] block mb-2 font-bold uppercase tracking-widest">Select Correct Option</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <button key={idx} onClick={() => setQuizForm({...quizForm, correct: idx})} className={`flex-1 py-2 rounded text-xs font-bold border transition-colors ${quizForm.correct === idx ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>Option {idx + 1}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleCreateQuiz} disabled={isPending || !quizForm.title || !quizForm.question} className="px-6 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Save Quiz to Database</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {initialQuizzes.map(q => (
          <div key={q.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">{q.title}</h4>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase mt-1 font-bold">Reward: ${Number(q.reward || 0.50).toFixed(2)}</p>
              </div>
              <button onClick={() => handleDeleteQuiz(q.id)} disabled={isPending} className="p-2 text-[var(--error)] bg-red-500/10 hover:bg-red-500/20 rounded transition-colors flex gap-2 items-center text-[10px] font-black uppercase"><Trash2 className="w-4 h-4" /> Delete</button>
            </div>
            {q.questions && q.questions[0] && (
              <div className="bg-[var(--surface-2)] p-4 rounded-md text-[11px] font-mono text-[var(--text-secondary)] mt-2">
                <p className="text-[var(--text-primary)] mb-3 font-sans font-bold text-xs uppercase tracking-widest">{q.questions[0].question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {q.questions[0].options.map((opt: string, i: number) => (
                    <div key={i} className={`px-3 py-2 rounded-md truncate ${i === q.questions[0].correctIndex ? 'bg-[var(--accent)] text-white' : 'bg-black/20'}`}>{i+1}. {opt}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {initialQuizzes.length === 0 && <div className="p-10 text-center text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-widest border border-dashed border-[var(--border)] rounded-xl">No Quizzes Exist</div>}
      </div>
    </div>
  )
}
