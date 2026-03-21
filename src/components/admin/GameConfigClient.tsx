'use client'

import { useState, useTransition } from 'react'
import { updateGameConfig } from '@/app/actions/adminActions'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface GameConfig {
  t2000WinToken: string
  t5000WinToken: string
  t10000WinToken: string
  t2000DailyLimit: number
  t5000DailyLimit: number
  t10000DailyLimit: number
}

export function GameConfigClient({ initialConfig }: { initialConfig: GameConfig | null }) {
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [config, setConfig] = useState<GameConfig>(initialConfig || {
    t2000WinToken: '1',
    t5000WinToken: '1',
    t10000WinToken: '1',
    t2000DailyLimit: 1,
    t5000DailyLimit: 1,
    t10000DailyLimit: 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateGameConfig(config)
        showToast('Game configuration synchronized', 'SUCCESS')
      } catch (error: any) {
        showToast('Failed to update protocol config', 'ERROR')
      }
    })
  }

  const handleChange = (field: keyof GameConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-20">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-(--surface) border border-(--border) rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-(--border) bg-(--surface-2)">
            <h3 className="text-sm font-black text-(--text-primary) uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-(--accent)" />
              Winning Token Logic
            </h3>
            <p className="text-[10px] text-(--text-tertiary) uppercase mt-1 font-bold">Define the specific node ID (1-5) that will be marked as successful during generation.</p>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Bronze Node (T2000)</label>
              <select 
                value={config.t2000WinToken}
                onChange={(e) => handleChange('t2000WinToken', e.target.value)}
                className="w-full bg-(--surface-2) border border-(--border) text-(--text-primary) rounded-lg p-3 text-sm focus:border-(--accent) outline-none"
              >
                {[1,2,3,4,5].map(v => <option key={v} value={v.toString()}>Node {v}</option>)}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Silver Node (T5000)</label>
              <select 
                value={config.t5000WinToken}
                onChange={(e) => handleChange('t5000WinToken', e.target.value)}
                className="w-full bg-(--surface-2) border border-(--border) text-(--text-primary) rounded-lg p-3 text-sm focus:border-(--accent) outline-none"
              >
                {[1,2,3,4,5].map(v => <option key={v} value={v.toString()}>Node {v}</option>)}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Gold Node (T10000)</label>
              <select 
                value={config.t10000WinToken}
                onChange={(e) => handleChange('t10000WinToken', e.target.value)}
                className="w-full bg-(--surface-2) border border-(--border) text-(--text-primary) rounded-lg p-3 text-sm focus:border-(--accent) outline-none"
              >
                {[1,2,3,4,5].map(v => <option key={v} value={v.toString()}>Node {v}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-(--surface) border border-(--border) rounded-xl overflow-hidden shadow-sm opacity-50 pointer-events-none">
          <div className="p-6 border-b border-(--border) bg-(--surface-2)">
            <h3 className="text-sm font-black text-(--text-primary) uppercase tracking-widest flex items-center gap-2">
              Daily Interaction Limits
            </h3>
            <p className="text-[10px] text-(--text-tertiary) uppercase mt-1 font-bold">Governance over frequency of node injections (Locked at 1 per day).</p>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Bronze Limit</label>
              <input type="number" readOnly value={1} className="w-full bg-(--surface-3) border border-(--border) text-(--text-tertiary) rounded-lg p-3 text-sm" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Silver Limit</label>
              <input type="number" readOnly value={1} className="w-full bg-(--surface-3) border border-(--border) text-(--text-tertiary) rounded-lg p-3 text-sm" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest">Gold Limit</label>
              <input type="number" readOnly value={1} className="w-full bg-(--surface-3) border border-(--border) text-(--text-tertiary) rounded-lg p-3 text-sm" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full h-14 bg-(--accent) text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-(--accent)/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
        >
          {isPending ? 'Synchronizing Protocols...' : <><Save className="w-5 h-5" /> Commit Configuration</>}
        </button>
      </form>
    </div>
  )
}
