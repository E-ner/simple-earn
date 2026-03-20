'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import { playGame, getGameStats, GameType } from '@/app/actions/gameActions'
import { formatCurrency, getCurrencyFromCountry } from '@/lib/currency'
import { Trophy, Zap, TrendingUp, AlertCircle, Gamepad2 } from 'lucide-react'
import EmptyState from '@/components/dashboard/EmptyState'
import { useToast } from '@/context/ToastContext'

export default function GamesPage() {
  const { showToast } = useToast()
  const { lang } = useParams()
  const [dict, setDict] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [selectedTier, setSelectedTier] = useState<GameType | null>(null)
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [gameResult, setGameResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [dictionary, gameStats] = await Promise.all([
          getDictionary(lang as Locale),
          getGameStats()
        ])
        setDict(dictionary)
        setStats(gameStats)
      } catch (err) {
        console.error('Failed to load games data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [lang])

  const handlePlay = async () => {
    if (!selectedTier || !selectedToken) return
    
    setPlaying(true)
    setError(null)
    setGameResult(null)

    try {
      const result = await playGame(selectedTier, selectedToken)
      setGameResult(result)

      // Refresh stats
      const newStats = await getGameStats()
      setStats(newStats)
    } catch (err: any) {
      showToast(err.message || 'Game play failed', 'ERROR')
    } finally {
      setPlaying(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-(--accent) border-t-transparent animate-spin" />
      </div>
    )
  }

  const tiers = [
    { id: 'T2000' as GameType, name: 'Bronze Node', cost: 2.00, win: 3.50 },
    { id: 'T5000' as GameType, name: 'Silver Node', cost: 5.00, win: 9.00 },
    { id: 'T10000' as GameType, name: 'Gold Node', cost: 10.00, win: 18.00 }
  ]

  const currency = getCurrencyFromCountry(stats?.country || 'US')

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="mb-2 space-y-2">
        <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">
          {dict?.games?.title || 'Token Strategy Games'}
        </h1>
        <p className="text-(--text-tertiary) max-w-2xl leading-relaxed">
          {dict?.games?.desc || 'Participate in decentralized probability games to multiply your verified tokens. (Animations Disabled)'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Game Selection */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div 
                key={tier.id} 
                onClick={() => setSelectedTier(tier.id)}
                className={`p-6 rounded-md border h-full transition-all text-left relative overflow-hidden cursor-pointer group ${
                  selectedTier === tier.id 
                    ? 'bg-(--accent)/10 border-(--accent)' 
                    : 'bg-(--surface-2) border-(--border) hover:bg-(--surface) hover:border-(--border-hover)'
                }`}
              >
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-(--text-primary) mb-1">{tier.name}</h3>
                  <div className="space-y-1">
                    <p className="text-[10px] text-(--text-tertiary) uppercase font-bold tracking-widest">{dict?.games?.cost || 'Entry'}</p>
                    <p className="text-xl font-bold text-(--text-primary)">{formatCurrency(tier.cost, currency)}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-(--border)">
                    <p className="text-[10px] text-(--text-tertiary) uppercase font-bold tracking-widest">{dict?.games?.winnings || 'Yield'}</p>
                    <p className="text-sm font-bold text-(--accent)">{formatCurrency(tier.win, currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedTier && (
            <div className="p-8 rounded-md bg-(--surface-2) border border-(--border) space-y-8 animate-in fade-in zoom-in duration-200">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-(--text-primary)">{dict?.games?.select_token || 'Identify Winning Node'}</h3>
                <p className="text-sm text-(--text-tertiary)">Select one of the five cryptographic nodes to match the network target.</p>
              </div>

              <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
                {['1', '2', '3', '4', '5'].map((token) => (
                  <button
                    key={token}
                    onClick={() => setSelectedToken(token)}
                    className={`aspect-square rounded-md flex items-center justify-center text-2xl font-black transition-all border-2 ${
                      selectedToken === token
                        ? 'bg-(--accent)/10 border-(--accent) text-(--accent)'
                        : 'bg-(--surface-3) border-(--border) text-(--text-tertiary) hover:border-(--accent)'
                    }`}
                  >
                    {token}
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  disabled={!selectedToken || playing}
                  onClick={handlePlay}
                  className={`h-12 px-12 rounded-md font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${
                    playing 
                      ? 'bg-(--surface-3) text-(--text-tertiary) cursor-not-allowed'
                      : 'bg-(--accent) text-white hover:opacity-90 shadow-lg shadow-(--accent)/20'
                  }`}
                >
                  {playing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      {dict?.games?.play || 'Initialize Game'}
                    </>
                  )}
                </button>
              </div>

              {gameResult && (
                <div
                  className={`p-6 rounded-md text-center space-y-2 border animate-in slide-in-from-bottom-4 duration-300 ${
                    gameResult.didWin 
                      ? 'bg-(--success)/10 border-(--success)/20' 
                      : 'bg-(--error)/10 border-(--error)/20'
                  }`}
                >
                  {gameResult.didWin ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-(--success)/20 flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-6 h-6 text-(--success)" />
                      </div>
                      <h4 className="text-(--success) font-bold">{dict?.games?.win_msg || 'Success!'}</h4>
                      <p className="text-(--text-primary) font-bold text-2xl">+{formatCurrency(gameResult.winnings, currency)}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-(--error)/20 flex items-center justify-center mx-auto mb-2">
                        <AlertCircle className="w-6 h-6 text-(--error)" />
                      </div>
                      <h4 className="text-(--error) font-bold">{dict?.games?.loss_msg || 'Mismatch'}</h4>
                      <p className="text-(--text-tertiary) text-sm">Target was Token {gameResult.winToken}</p>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-(--error)/10 border border-(--error)/20 text-(--error) text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          <div className="p-8 rounded-md bg-(--surface-2) border border-(--border)">
            <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-(--accent)" />
              History
            </h3>
            
            <div className="space-y-4">
              {stats?.recentPlays?.map((play: any) => (
                <div key={play.id} className="flex items-center justify-between p-3 rounded-md bg-(--surface-3) border border-(--border)">
                  <div>
                    <p className="text-xs font-bold text-(--text-primary) uppercase tracking-tighter">{play.gameType}</p>
                    <p className="text-[10px] text-(--text-tertiary)">Picked {play.tokenPicked}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${play.didWin ? 'text-(--success)' : 'text-(--text-tertiary)'}`}>
                      {play.didWin ? `+${formatCurrency(Number(play.winnings), currency)}` : `-${formatCurrency(Number(play.amount), currency)}`}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!stats?.recentPlays || stats.recentPlays.length === 0) && (
                <EmptyState 
                  icon={Gamepad2}
                  title="Strategy Log Empty"
                  description="No cryptographic game interactions detected. Initialize a node to begin yielding."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
