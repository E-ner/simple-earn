'use client'

import { useState, useTransition } from 'react'
import { setDailySchedule, getScheduleForDate } from '@/app/actions/adminActions'
import { Calendar, Save, Plus, Video as VideoIcon, HelpCircle, Trash2 } from 'lucide-react'
import { adminCreateVideo, adminCreateQuiz, adminDeleteVideo, adminDeleteQuiz } from '@/app/actions/adminActions'

interface Item { id: string, title: string, isActive: boolean, [key: string]: any }

export function ContentSchedulerClient({ quizzes, videos, initialSchedule, defaultDate }: {
  quizzes: Item[], videos: Item[], initialSchedule: any, defaultDate: string
}) {
  const [date, setDate] = useState(defaultDate)
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>(
    initialSchedule ? (initialSchedule.quizIds as string[]) : []
  )
  const [selectedVideos, setSelectedVideos] = useState<string[]>(
    initialSchedule ? (initialSchedule.videoIds as string[]) : []
  )
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const loadSchedule = (d: string) => {
    startTransition(async () => {
      const schedule = await getScheduleForDate(d)
      setSelectedQuizzes(schedule ? (schedule.quizIds as string[]) : [])
      setSelectedVideos(schedule ? (schedule.videoIds as string[]) : [])
    })
  }

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const handleSave = () => {
    startTransition(async () => {
      await setDailySchedule(date, selectedQuizzes, selectedVideos)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const [showVideoForm, setShowVideoForm] = useState(false)
  const [videoForm, setVideoForm] = useState({ title: '', url: '', reward: 0.20, duration: 60 })
  const handleCreateVideo = () => {
    startTransition(async () => {
      await adminCreateVideo(videoForm)
      setShowVideoForm(false)
      setVideoForm({ title: '', url: '', reward: 0.20, duration: 60 })
    })
  }

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

  const handleDeleteVideo = (id: string) => {
    if (confirm('Delete this video?')) {
      startTransition(async () => await adminDeleteVideo(id))
    }
  }

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Delete this quiz?')) {
      startTransition(async () => await adminDeleteQuiz(id))
    }
  }

  return (
    <div className="space-y-8">
      {/* Creation Tools */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => { setShowVideoForm(!showVideoForm); setShowQuizForm(false) }} 
            className="flex items-center gap-2 px-4 py-2 bg-(--surface-2) text-(--text-primary) border border-(--border) rounded-lg text-xs font-bold hover:bg-(--surface)">
          <VideoIcon className="w-4 h-4 text-(--purple)" /> {showVideoForm ? 'Cancel' : 'New Video'}
        </button>
        <button onClick={() => { setShowQuizForm(!showQuizForm); setShowVideoForm(false) }} 
            className="flex items-center gap-2 px-4 py-2 bg-(--surface-2) text-(--text-primary) border border-(--border) rounded-lg text-xs font-bold hover:bg-(--surface)">
          <HelpCircle className="w-4 h-4 text-(--accent)" /> {showQuizForm ? 'Cancel' : 'New Quiz'}
        </button>
      </div>

      {showVideoForm && (
        <div className="p-6 bg-(--surface) border border-(--border) rounded-xl space-y-4 mb-8">
          <h3 className="text-sm font-black text-(--text-primary) uppercase">Create Video</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="YouTube/Cloudinary URL" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="number" step="0.01" placeholder="Reward (e.g. 0.20)" value={videoForm.reward} onChange={e => setVideoForm({...videoForm, reward: Number(e.target.value)})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="number" placeholder="Duration (seconds)" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: Number(e.target.value)})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
          </div>
          <button onClick={handleCreateVideo} disabled={isPending || !videoForm.title || !videoForm.url} className="px-4 py-2 bg-(--purple) text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Save Video</button>
        </div>
      )}

      {showQuizForm && (
        <div className="p-6 bg-(--surface) border border-(--border) rounded-xl space-y-4 mb-8">
          <h3 className="text-sm font-black text-(--text-primary) uppercase">Create Quiz (1 Question MVP)</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Quiz Title" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="number" step="0.01" placeholder="Reward (e.g. 0.50)" value={quizForm.reward} onChange={e => setQuizForm({...quizForm, reward: Number(e.target.value)})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Question Text" value={quizForm.question} onChange={e => setQuizForm({...quizForm, question: e.target.value})} className="col-span-2 px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Option 1" value={quizForm.opt1} onChange={e => setQuizForm({...quizForm, opt1: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Option 2" value={quizForm.opt2} onChange={e => setQuizForm({...quizForm, opt2: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Option 3" value={quizForm.opt3} onChange={e => setQuizForm({...quizForm, opt3: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Option 4" value={quizForm.opt4} onChange={e => setQuizForm({...quizForm, opt4: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <div className="col-span-2 mt-2">
              <label className="text-xs text-(--text-tertiary) block mb-2 font-bold uppercase tracking-widest">Select Correct Option</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <button key={idx} onClick={() => setQuizForm({...quizForm, correct: idx})} className={`flex-1 py-2 rounded text-xs font-bold border transition-colors ${quizForm.correct === idx ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--surface-2) text-(--text-secondary) border-(--border) hover:bg-(--surface)'}`}>Option {idx + 1}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleCreateQuiz} disabled={isPending || !quizForm.title || !quizForm.question} className="px-4 py-2 bg-(--accent) text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Save Quiz</button>
        </div>
      )}

      {/* Date Picker */}
      <div className="flex items-center gap-4 p-5 bg-(--surface) border border-(--border) rounded-xl">
        <Calendar className="w-5 h-5 text-(--accent)" />
        <div>
          <label className="text-[10px] text-(--text-tertiary) uppercase tracking-widest font-black block mb-1">Schedule Date</label>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); loadSchedule(e.target.value) }}
            className="text-sm font-bold text-(--text-primary) bg-transparent focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quizzes */}
        <div className="bg-(--surface) border border-(--border) rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-(--border)">
            <h3 className="text-sm font-black text-(--text-primary)">Quizzes</h3>
            <p className="text-xs text-(--text-tertiary) mt-0.5">{selectedQuizzes.length} selected</p>
          </div>
          <div className="p-3 max-h-72 overflow-y-auto space-y-1.5">
            {quizzes.map(q => (
              <button key={q.id}
                onClick={() => toggle(q.id, selectedQuizzes, setSelectedQuizzes)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedQuizzes.includes(q.id)
                    ? 'bg-(--accent)/10 border border-(--accent)/20 text-(--accent)'
                    : 'hover:bg-(--surface-2) text-(--text-secondary) border border-transparent'
                }`}>
                {selectedQuizzes.includes(q.id) ? '✓ ' : ''}{q.title}
              </button>
            ))}
            {quizzes.length === 0 && <p className="text-(--text-tertiary) text-xs px-3 py-4">No quizzes found</p>}
          </div>
        </div>

        {/* Videos */}
        <div className="bg-(--surface) border border-(--border) rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-(--border)">
            <h3 className="text-sm font-black text-(--text-primary)">Videos</h3>
            <p className="text-xs text-(--text-tertiary) mt-0.5">{selectedVideos.length} selected</p>
          </div>
          <div className="p-3 max-h-72 overflow-y-auto space-y-1.5">
            {videos.map(v => (
              <button key={v.id}
                onClick={() => toggle(v.id, selectedVideos, setSelectedVideos)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedVideos.includes(v.id)
                    ? 'bg-(--purple)/10 border border-(--purple)/20 text-(--purple)'
                    : 'hover:bg-(--surface-2) text-(--text-secondary) border border-transparent'
                }`}>
                {selectedVideos.includes(v.id) ? '✓ ' : ''}{v.title}
              </button>
            ))}
            {videos.length === 0 && <p className="text-(--text-tertiary) text-xs px-3 py-4">No videos found</p>}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="flex items-center gap-2 px-6 py-3 bg-(--accent) text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
        <Save className="w-4 h-4" />
        {isPending ? 'Saving...' : saved ? '✓ Saved!' : 'Save Schedule'}
      </button>

      {/* Database Management Below */}
      <div className="mt-16 pt-16 border-t border-(--border) space-y-8">
        <div>
          <h2 className="text-xl font-black text-(--text-primary) mb-6">Database Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Manage Quizzes */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-(--text-tertiary) uppercase tracking-widest">All Quizzes</h3>
              <div className="space-y-3">
                {quizzes.map(q => (
                  <div key={q.id} className="p-4 bg-(--surface) border border-(--border) rounded-lg flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-(--text-primary)">{q.title}</h4>
                        <p className="text-[10px] text-(--text-tertiary) uppercase mt-1">Reward: ${Number(q.reward || 0.50).toFixed(2)}</p>
                      </div>
                      <button onClick={() => handleDeleteQuiz(q.id)} disabled={isPending} className="p-1.5 text-(--error) hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {q.questions && q.questions[0] && (
                      <div className="bg-(--surface-2) p-3 rounded text-[10px] font-mono text-(--text-secondary)">
                        <p className="text-(--text-primary) mb-2 font-sans font-bold">Q: {q.questions[0].question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.questions[0].options.map((opt: string, i: number) => (
                            <div key={i} className={`px-2 py-1 rounded truncate ${i === q.questions[0].correctIndex ? 'bg-(--accent)/10 text-(--accent)' : 'bg-black/20'}`}>{i+1}. {opt}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Manage Videos */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-(--text-tertiary) uppercase tracking-widest">All Videos</h3>
              <div className="space-y-3">
                {videos.map(v => (
                  <div key={v.id} className="p-4 bg-(--surface) border border-(--border) rounded-lg flex justify-between items-start cursor-pointer hover:border-(--purple) transition-colors group">
                     <div>
                        <h4 className="text-xs font-bold text-(--text-primary)">{v.title}</h4>
                        <p className="text-[10px] text-(--text-tertiary) uppercase mt-1">Reward: ${Number(v.reward || 0.20).toFixed(2)} • {v.duration}s</p>
                        <a href={v.url} target="_blank" className="text-[10px] text-(--purple) hover:underline mt-2 inline-block">View Link</a>
                      </div>
                      <button onClick={() => handleDeleteVideo(v.id)} disabled={isPending} className="p-1.5 text-(--error) opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
