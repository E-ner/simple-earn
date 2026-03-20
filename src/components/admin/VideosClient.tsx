'use client'
import { useState, useTransition } from 'react'
import { Trash2, Video as VideoIcon } from 'lucide-react'
import { adminCreateVideo, adminDeleteVideo } from '@/app/actions/adminActions'

interface VideoItem { 
  id: string, 
  title: string, 
  url: string, 
  reward: any, 
  duration: number,
  verificationCode?: string | null,
  isNewUserVideo: boolean 
}

export function VideosClient({ initialVideos }: { initialVideos: VideoItem[] }) {
  const [isPending, startTransition] = useTransition()
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [videoForm, setVideoForm] = useState({ 
    title: '', 
    url: '', 
    reward: 0.20, 
    duration: 60,
    verificationCode: '',
    isNewUserVideo: false
  })

  const handleCreateVideo = () => {
    startTransition(async () => {
      await adminCreateVideo(videoForm)
      setShowVideoForm(false)
      setVideoForm({ title: '', url: '', reward: 0.20, duration: 60, verificationCode: '', isNewUserVideo: false })
    })
  }

  const handleDeleteVideo = (id: string) => {
    if (confirm('Delete this video permanently?')) {
      startTransition(async () => await adminDeleteVideo(id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-(--text-primary) tracking-tight">Video Library</h2>
        <button onClick={() => setShowVideoForm(!showVideoForm)} 
            className="flex items-center gap-2 px-4 py-2 bg-(--purple) text-white rounded-lg text-xs font-bold hover:opacity-90">
          <VideoIcon className="w-4 h-4" /> {showVideoForm ? 'Cancel' : 'Upload Video'}
        </button>
      </div>

      {showVideoForm && (
        <div className="p-6 bg-(--surface) border border-(--border) rounded-xl space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-(--text-primary) uppercase">Add New Video</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="col-span-2 px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="YouTube/Cloudinary Link" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} className="col-span-2 px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="number" step="0.01" placeholder="Reward Ex: 0.20" value={videoForm.reward} onChange={e => setVideoForm({...videoForm, reward: Number(e.target.value)})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="number" placeholder="Duration (seconds)" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: Number(e.target.value)})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <input type="text" placeholder="Verification Code (Optional)" value={videoForm.verificationCode} onChange={e => setVideoForm({...videoForm, verificationCode: e.target.value})} className="px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md text-xs text-(--text-primary)" />
            <label className="flex items-center gap-2 px-3 py-2 bg-(--surface-2) border border-(--border) rounded-md cursor-pointer">
              <input type="checkbox" checked={videoForm.isNewUserVideo} onChange={e => setVideoForm({...videoForm, isNewUserVideo: e.target.checked})} className="accent-(--purple)" />
              <span className="text-[10px] font-bold text-(--text-secondary) uppercase">For New Users Only</span>
            </label>
          </div>
          <button onClick={handleCreateVideo} disabled={isPending || !videoForm.title || !videoForm.url} className="px-6 py-2 bg-(--purple) text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Save Video to Database</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialVideos.map(v => (
          <div key={v.id} className="p-4 bg-(--surface) border border-(--border) rounded-lg flex flex-col justify-between gap-4 group">
            <div className="flex justify-between items-start gap-4">
               <div>
                  <h4 className="text-sm font-bold text-(--text-primary)">{v.title}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <p className="text-[10px] text-(--text-tertiary) uppercase font-bold">Reward: ${Number(v.reward || 0.20).toFixed(2)} • {v.duration}s</p>
                    {v.isNewUserVideo && <span className="text-[9px] bg-(--purple)/10 text-(--purple) px-1.5 py-0.5 rounded font-black uppercase">New Users</span>}
                    {v.verificationCode && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase">Code: {v.verificationCode}</span>}
                  </div>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-(--purple) hover:underline mt-2 inline-block font-mono tracking-tight w-full truncate max-w-[200px]">{v.url}</a>
                </div>
                <button onClick={() => handleDeleteVideo(v.id)} disabled={isPending} className="p-2 text-(--error) bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded-md"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {initialVideos.length === 0 && <div className="col-span-2 p-10 text-center text-(--text-tertiary) text-xs font-bold uppercase tracking-widest border border-dashed border-(--border) rounded-xl">No Videos Originated</div>}
      </div>
    </div>
  )
}
