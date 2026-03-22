'use client'

import { useState, useTransition } from 'react'
import { updateGameConfig } from '@/app/actions/adminActions'
import { Save, Trophy, Zap, Shield, ChevronDown, ChevronUp, Info, X, Plus } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface GameConfig {
  t2000DailyLimit: number
  t5000DailyLimit: number
  t10000DailyLimit: number
  t2000NumberPool: number[]
  t5000NumberPool: number[]
  t10000NumberPool: number[]
}

const TIER_META = {
  T2000: {
    label: 'Bronze',
    cost: 2.0,
    win: 3.5,
    icon: Shield,
    color: 'text-(--accent)',
    bg: 'bg-(--accent)/10',
    border: 'border-(--accent)/30',
    activeBorder: 'border-(--accent)',
    limitField: 't2000DailyLimit' as keyof GameConfig,
    poolField: 't2000NumberPool' as keyof GameConfig,
  },
  T5000: {
    label: 'Silver',
    cost: 5.0,
    win: 9.0,
    icon: Zap,
    color: 'text-(--purple)',
    bg: 'bg-(--purple)/10',
    border: 'border-(--purple)/30',
    activeBorder: 'border-(--purple)',
    limitField: 't5000DailyLimit' as keyof GameConfig,
    poolField: 't5000NumberPool' as keyof GameConfig,
  },
  T10000: {
    label: 'Gold',
    cost: 10.0,
    win: 18.0,
    icon: Trophy,
    color: 'text-(--success)',
    bg: 'bg-(--success)/10',
    border: 'border-(--success)/30',
    activeBorder: 'border-(--success)',
    limitField: 't10000DailyLimit' as keyof GameConfig,
    poolField: 't10000NumberPool' as keyof GameConfig,
  },
}

function parsePool(val: any): number[] {
  if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n))
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

export function GameConfigClient({ initialConfig }: { initialConfig: any }) {
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [expandedTier, setExpandedTier] = useState<string | null>('T2000')

  const [config, setConfig] = useState<GameConfig>({
    t2000DailyLimit: initialConfig?.t2000DailyLimit ?? 3,
    t5000DailyLimit: initialConfig?.t5000DailyLimit ?? 3,
    t10000DailyLimit: initialConfig?.t10000DailyLimit ?? 3,
    t2000NumberPool: parsePool(initialConfig?.t2000NumberPool ?? [7, 77, 777]),
    t5000NumberPool: parsePool(initialConfig?.t5000NumberPool ?? [8, 88, 888]),
    t10000NumberPool: parsePool(initialConfig?.t10000NumberPool ?? [9, 99, 999]),
  })

  // Per-tier number input state
  const [numInputs, setNumInputs] = useState({ T2000: '', T5000: '', T10000: '' })

  const handleLimitChange = (field: keyof GameConfig, value: string) => {
    const parsed = parseInt(value)
    if (!isNaN(parsed) && parsed >= 1) {
      setConfig(prev => ({ ...prev, [field]: parsed }))
    }
  }

  const addToPool = (tier: keyof typeof TIER_META, poolField: keyof GameConfig) => {
    const raw = numInputs[tier].trim()
    const num = parseInt(raw)
    if (isNaN(num)) return
    const pool = config[poolField] as number[]
    if (pool.includes(num)) {
      showToast(`${num} already in pool`, 'ERROR')
      return
    }
    setConfig(prev => ({ ...prev, [poolField]: [...pool, num].sort((a, b) => a - b) }))
    setNumInputs(prev => ({ ...prev, [tier]: '' }))
  }

  const removeFromPool = (poolField: keyof GameConfig, num: number) => {
    const pool = config[poolField] as number[]
    setConfig(prev => ({ ...prev, [poolField]: pool.filter(n => n !== num) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateGameConfig(config)
        showToast('Game configuration synchronized', 'SUCCESS')
      } catch {
        showToast('Failed to update protocol config', 'ERROR')
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-20">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Info banner */}
        <div className="flex gap-3 p-4 bg-(--surface) border border-(--border) rounded-xl text-xs text-(--text-tertiary)">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-(--accent)" />
          <p>
            Define a <span className="text-(--text-primary) font-bold">number pool</span> per tier — these are the available numbers
            the admin picks from when scheduling daily winners. Exactly <span className="text-(--text-primary) font-bold">3 winning numbers</span> are
            selected per tier each day in the <span className="text-(--text-primary) font-bold">Content Scheduler</span>.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="space-y-4">
          {(Object.entries(TIER_META) as [keyof typeof TIER_META, typeof TIER_META['T2000']][]).map(([tier, meta]) => {
            const Icon = meta.icon
            const isExpanded = expandedTier === tier
            const currentLimit = config[meta.limitField] as number
            const pool = config[meta.poolField] as number[]

            return (
              <div key={tier} className={`bg-(--surface) border rounded-xl overflow-hidden transition-all ${isExpanded ? meta.activeBorder : meta.border}`}>

                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandedTier(isExpanded ? null : tier)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-(--surface-2) transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-(--text-primary)">{meta.label} Tier</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{tier}</span>
                      </div>
                      <p className="text-[11px] text-(--text-tertiary) mt-0.5">
                        Cost <span className="text-(--text-primary) font-bold">${meta.cost.toFixed(2)}</span>
                        {' · '}
                        Win <span className="text-(--text-primary) font-bold">${meta.win.toFixed(2)}</span>
                        {' · '}
                        Limit <span className={`font-black ${meta.color}`}>{currentLimit}x/day</span>
                        {' · '}
                        Pool <span className={`font-black ${meta.color}`}>{pool.length} numbers</span>
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-(--text-tertiary)" />
                    : <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />}
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-(--border) bg-(--surface-2)">

                    {/* Stats + Limit */}
                    <div className="px-6 pt-5 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest">Entry Cost</p>
                        <p className="text-xl font-black text-(--text-primary)">${meta.cost.toFixed(2)}</p>
                        <p className="text-[10px] text-(--text-tertiary)">Deducted from game balance</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest">Win Payout</p>
                        <p className={`text-xl font-black ${meta.color}`}>${meta.win.toFixed(2)}</p>
                        <p className="text-[10px] text-(--text-tertiary)">{((meta.win / meta.cost - 1) * 100).toFixed(0)}% return on win</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest">Daily Play Limit</p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleLimitChange(meta.limitField, String(currentLimit - 1))} disabled={currentLimit <= 1}
                            className="w-9 h-9 rounded-lg bg-(--surface) border border-(--border) text-(--text-primary) font-black text-lg flex items-center justify-center hover:bg-(--surface-2) disabled:opacity-30 transition-colors">−</button>
                          <input type="number" min={1} max={99} value={currentLimit}
                            onChange={e => handleLimitChange(meta.limitField, e.target.value)}
                            className={`w-16 text-center bg-(--surface) border rounded-lg p-2 text-sm font-black text-(--text-primary) focus:outline-none ${meta.border}`} />
                          <button type="button" onClick={() => handleLimitChange(meta.limitField, String(currentLimit + 1))} disabled={currentLimit >= 99}
                            className="w-9 h-9 rounded-lg bg-(--surface) border border-(--border) text-(--text-primary) font-black text-lg flex items-center justify-center hover:bg-(--surface-2) disabled:opacity-30 transition-colors">+</button>
                        </div>
                        <p className="text-[10px] text-(--text-tertiary)">Max plays per user per day</p>
                      </div>
                    </div>

                    {/* Number Pool */}
                    <div className="px-6 pb-6 space-y-3 border-t border-(--border) pt-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest">Number Pool</p>
                          <p className="text-[10px] text-(--text-tertiary) mt-0.5">Admin picks 3 of these as daily winners in the Scheduler</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>{pool.length} numbers</span>
                      </div>

                      {/* Pool chips */}
                      <div className="flex flex-wrap gap-2 min-h-10">
                        {pool.length === 0 && (
                          <p className="text-[10px] text-(--text-tertiary) italic py-2">No numbers in pool yet. Add some below.</p>
                        )}
                        {pool.map(num => (
                          <div key={num} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${meta.bg} ${meta.border} group`}>
                            <span className={`text-xs font-black ${meta.color}`}>{num}</span>
                            <button
                              type="button"
                              onClick={() => removeFromPool(meta.poolField, num)}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity ${meta.color}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add number input */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Add a number..."
                          value={numInputs[tier]}
                          onChange={e => setNumInputs(prev => ({ ...prev, [tier]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToPool(tier, meta.poolField))}
                          className={`flex-1 px-3 py-2 bg-(--surface) border rounded-lg text-xs font-black text-(--text-primary) focus:outline-none focus:border-(--accent) ${meta.border}`}
                        />
                        <button
                          type="button"
                          onClick={() => addToPool(tier, meta.poolField)}
                          disabled={!numInputs[tier].trim()}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-colors disabled:opacity-40 ${meta.bg} ${meta.color} border ${meta.border} hover:opacity-80`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-5 bg-(--surface) border border-(--border) rounded-xl">
          {(Object.entries(TIER_META) as [keyof typeof TIER_META, typeof TIER_META['T2000']][]).map(([tier, meta]) => (
            <div key={tier} className="text-center">
              <p className="text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest mb-1">{meta.label}</p>
              <p className={`text-2xl font-black ${meta.color}`}>{(config[meta.limitField] as number)}</p>
              <p className="text-[10px] text-(--text-tertiary)">plays/day</p>
              <p className={`text-[10px] font-bold mt-1 ${meta.color}`}>{(config[meta.poolField] as number[]).length} in pool</p>
            </div>
          ))}
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