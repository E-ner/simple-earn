'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Loader2, ArrowRightLeft, Sparkles, Zap, CheckCircle2, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react'
import { getWalletData, requestWithdrawal, transferToGameBalance, initiateDeposit, getPaymentMethods, activateAccountWithProof } from '@/app/actions/walletActions'
import { Camera, Send, X } from 'lucide-react'
import { formatCurrency, formatRaw, getCurrencyFromCountry, convertToUSD } from '@/lib/currency'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import { useToast } from '@/context/ToastContext'

export default function WalletPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'history' | 'withdrawal' | 'transfer' | 'deposit'>('history')
  const [viewImage, setViewImage] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositRef, setDepositRef] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [dict, setDict] = useState<any>(null)
  const { lang } = useParams()

  useEffect(() => {
    async function load() {
      try {
        const [walletData, dictionary, methods] = await Promise.all([
          getWalletData(),
          getDictionary(lang as Locale),
          getPaymentMethods()
        ])
        setData(walletData)
        setDict(dictionary)
        setPaymentMethods(methods)
        if (methods.length > 0) setSelectedMethod(methods[0])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lang])

  useEffect(() => {
    if (proofImage) {
      const url = URL.createObjectURL(proofImage)
      setProofPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setProofPreview(null)
    }
  }, [proofImage])

  const reload = async () => setData(await getWalletData())

  // User's local currency — all display values use this
  const currency = getCurrencyFromCountry(data?.country || 'US')

  /**
   * Transaction history display:
   * - External (DEPOSIT, WITHDRAWAL, ACTIVATION, GAME_DEPOSIT):
   *     show localAmount in stored currency (exactly what user paid/received)
   * - Internal (EARNING, TRANSFER, GAME_WIN, GAME_LOSS):
   *     convert USD amount → local currency for display
   */
  function txDisplayAmount(tx: any): string {
    const externalTypes = ['DEPOSIT', 'WITHDRAWAL', 'ACTIVATION', 'GAME_DEPOSIT']
    if (externalTypes.includes(tx.type) && tx.localAmount) {
      return formatRaw(tx.localAmount, tx.currency || currency)
    }
    return formatCurrency(tx.amount, currency)
  }

  // All amount inputs are in LOCAL currency. Actions convert to USD before storing.
  const handleWithdrawal = async () => {
    const localAmt = Number(withdrawalAmount)
    if (!withdrawalAmount || localAmt <= 0) return showToast(`Enter withdrawal amount in ${currency}`, 'ERROR')
    const usdAmt = convertToUSD(localAmt, currency)
    if (usdAmt < 1) return showToast(`Minimum withdrawal is ${formatCurrency(1, currency)}`, 'ERROR')
    if (usdAmt > 100) return showToast(`Maximum withdrawal is ${formatCurrency(100, currency)}`, 'ERROR')
    if (!selectedMethod) return showToast('Select payout channel', 'ERROR')
    if (!withdrawalAddress) return showToast('Enter destination address/account', 'ERROR')

    setSubmitting(true)
    try {
      const result = await requestWithdrawal(localAmt, selectedMethod.name, withdrawalAddress)
      if (result.success) {
        showToast('Withdrawal request submitted.', 'SUCCESS')
        await reload()
        setWithdrawalAmount('')
        setWithdrawalAddress('')
        setActiveTab('history')
      }
    } catch (e: any) {
      showToast(e.message || 'Withdrawal failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivation = async () => {
    if (!selectedMethod) return showToast('Select payment channel', 'ERROR')
    if (!proofImage) return showToast('Payment proof required', 'ERROR')
    if (!depositAmount || Number(depositAmount) <= 0) return showToast(`Enter activation amount in ${currency}`, 'ERROR')

    setSubmitting(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proofImage)
      })
      const res = await activateAccountWithProof(selectedMethod.name, depositRef, base64, Number(depositAmount)) as any
      if (res.error) throw new Error(res.error)
      showToast('Activation request sent. Pending review.', 'SUCCESS')
      await reload()
      setProofImage(null)
      setDepositRef('')
      setDepositAmount('')
    } catch (e: any) {
      showToast(e.message || 'Activation failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferAmount || Number(transferAmount) <= 0) return

    setSubmitting(true)
    try {
      const res = await transferToGameBalance(Number(transferAmount)) as any
      if (res.error) throw new Error(res.error)
      showToast('Transfer successful!', 'SUCCESS')
      await reload()
      setTransferAmount('')
      setActiveTab('history')
    } catch (e: any) {
      showToast(e.message || 'Transfer failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return
    if (!selectedMethod) return showToast('Select payment channel', 'ERROR')
    if (!proofImage) return showToast('Payment proof required', 'ERROR')

    setSubmitting(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proofImage)
      })
      const res = await initiateDeposit(Number(depositAmount), selectedMethod.name, base64, depositRef) as any
      if (res.error) throw new Error(res.error)
      showToast(dict?.wallet?.deposit_success || 'Deposit submitted! Awaiting review.', 'SUCCESS')
      await reload()
      setDepositAmount('')
      setDepositRef('')
      setProofImage(null)
      setActiveTab('history')
    } catch (e: any) {
      showToast(e.message || 'Deposit failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-(--accent) animate-spin" />
    </div>
  )

  // Live USD previews from local input
  const depositUSD   = Number(depositAmount)    > 0 ? convertToUSD(Number(depositAmount),    currency) : 0
  const transferUSD  = Number(transferAmount)   > 0 ? convertToUSD(Number(transferAmount),   currency) : 0
  const withdrawUSD  = Number(withdrawalAmount) > 0 ? convertToUSD(Number(withdrawalAmount), currency) : 0

  return (
    <div className="pb-20">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">{dict?.wallet?.title || 'Financial Hub'}</h1>
        <p className="text-(--text-secondary) max-w-2xl">{dict?.wallet?.desc || 'Manage your verified assets.'}</p>
      </header>

      {/* Activation Banner */}
      {!(data?.user?.isActivated || data?.user?.isActive || data?.transactions?.some((tx: any) => tx.type === 'ACTIVATION' && tx.status === 'APPROVED')) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-md bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">{dict?.wallet?.activate_title || 'Account Activation Required'}</h3>
              <p className="text-xs text-(--text-secondary) max-w-md">{dict?.wallet?.activate_desc || 'Initialize your account for a one-time protocol fee.'}</p>
            </div>
          </div>
          <button onClick={handleActivation} disabled={submitting}
            className="h-11 px-8 bg-orange-500 text-(--text-inverse) text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {dict?.wallet?.activate_btn || 'Initialize Node Now'}
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Balance Card — always in local currency */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-8 rounded-md bg-gradient-to-br from-(--accent)/10 to-(--surface-2) border border-(--accent)/10 relative overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="text-[10px] font-black text-(--accent) uppercase tracking-widest mb-4">
                {dict?.wallet?.current_assets || 'Current Assets'}
              </div>
              <div className="text-5xl font-bold text-(--text-primary) tracking-tighter mb-2">
                {formatCurrency(data?.balances?.total, currency)}
              </div>
              <p className="text-xs text-(--text-secondary)">≈ ${data?.balances?.total?.toFixed(2)} USD</p>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-(--border) pt-8">
                <div>
                  <div className="text-[10px] font-bold text-(--text-tertiary) uppercase tracking-widest">{dict?.dashboard?.balances?.main || 'Main'}</div>
                  <div className="text-lg font-bold text-(--text-primary)">{formatCurrency(data?.balances?.main, currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">{dict?.dashboard?.balances?.game || 'Game'}</div>
                  <div className="text-lg font-bold text-(--purple)">{formatCurrency(data?.balances?.game, currency)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-md bg-(--surface-2) border border-(--border) flex items-center gap-4">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${data?.user?.isActivated ? 'bg-(--success)/10 text-(--success)' : 'bg-orange-500/10 text-orange-500'}`}>
              {data?.user?.isActivated ? <ShieldCheck className="w-5 h-5" /> : <History className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-(--text-primary)">{data?.user?.isActivated ? 'Protocol Verified' : 'Initialization Pending'}</p>
              <p className="text-[10px] text-(--text-tertiary) uppercase">{data?.country} · {currency}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2 card p-1 flex flex-col min-h-[500px]">
          <div className="flex border-b border-(--border) overflow-x-auto">
            {(['history', 'deposit', 'withdrawal', 'transfer'] as const).map((tab) => {
              const labels: Record<string, string> = {
                history: dict?.wallet?.history || 'Audit Log',
                deposit: dict?.wallet?.deposit_game || 'Deposit',
                withdrawal: dict?.wallet?.withdraw || 'Withdraw',
                transfer: dict?.wallet?.transfer_to_game || 'Transfer',
              }
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-(--text-primary) border-b-2 border-(--accent)' : 'text-(--text-tertiary) hover:text-(--text-secondary)'}`}>
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          <div className="flex-1 p-6 relative">
            <AnimatePresence mode="wait">

              {/* HISTORY — 4 most recent, link to full page */}
              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {data?.transactions?.slice(0, 4).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-(--surface-3) transition-colors border border-transparent hover:border-(--border)">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? 'bg-(--success)/10 text-(--success)' : tx.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {tx.type === 'TRANSFER' ? <ArrowRightLeft size={16} /> : ['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-(--text-primary)">{tx.notes || tx.type.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-(--text-secondary) font-mono">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className={`text-sm font-bold ${['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? 'text-green-500' : tx.type === 'TRANSFER' ? 'text-blue-400' : 'text-orange-500'}`}>
                          {['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? '+' : tx.type === 'TRANSFER' ? '~' : '-'}
                          {txDisplayAmount(tx)}
                        </p>
                        <div className="flex items-center gap-2">
                          {tx.proofImage && (
                            <button onClick={() => setViewImage(tx.proofImage)}
                              className="text-[9px] text-(--accent) hover:underline uppercase font-bold tracking-tighter">
                              View Receipt
                            </button>
                          )}
                          <p className="text-[10px] text-[#555] uppercase tracking-widest">{tx.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data?.transactions?.length === 0 && (
                    <div className="py-16 text-center text-[#555] text-[10px] uppercase tracking-[0.2em] font-black">No transactions yet</div>
                  )}
                  {(data?.transactions?.length ?? 0) > 0 && (
                    <a href={`/${lang}/dashboard/transactions`}
                      className="flex items-center justify-center gap-2 w-full py-3 mt-1 rounded-xl border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) text-[10px] font-black text-(--text-tertiary) uppercase tracking-widest transition-colors">
                      View all transactions
                      <ArrowUpRight size={12} />
                    </a>
                  )}
                </motion.div>
              )}

              {/* DEPOSIT */}
              {activeTab === 'deposit' && (
                <motion.div key="deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-lg mx-auto py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Amount ({currency})</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-14 bg-(--surface-2) border border-(--border) rounded-md px-6 text-xl font-bold text-(--text-primary) focus:border-(--accent) outline-none transition-all" />
                    {depositUSD > 0 && (
                      <p className="text-[10px] text-(--text-tertiary) px-1">
                        ≈ <span className="font-bold text-(--text-primary)">${depositUSD.toFixed(2)} USD</span> credited to your balance on approval
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Select Channel</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentMethods.map((m) => (
                        <button key={m.id} onClick={() => setSelectedMethod(m)}
                          className={`p-4 rounded-md border text-left transition-all flex items-center justify-between ${selectedMethod?.id === m.id ? 'border-(--accent) bg-(--accent)/5' : 'border-(--border) bg-(--surface-2)'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMethod?.id === m.id ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>{m.name}</span>
                          {selectedMethod?.id === m.id && <Zap size={12} className="text-(--accent)" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedMethod?.instructions && (
                    <div className="p-4 rounded-md bg-(--surface-3) border border-(--border)">
                      <h4 className="text-[10px] font-black text-(--accent) uppercase tracking-widest mb-2">Payment Instructions</h4>
                      <p className="text-[11px] text-(--text-secondary) font-mono leading-tight whitespace-pre-line uppercase select-all">
                        {selectedMethod.instructions}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">{dict?.wallet?.pay_ref || 'Reference / TX ID'}</label>
                    <input type="text" value={depositRef} onChange={(e) => setDepositRef(e.target.value)}
                      placeholder="Receipt ID / TX Hash"
                      className="w-full h-12 bg-(--surface-2) border border-(--border) rounded-md px-4 text-xs font-mono text-(--text-primary) outline-none focus:border-(--accent) transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Payment Proof</label>
                    <div className="relative group">
                      <input type="file" accept="image/*" onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`h-24 rounded-md border-2 border-dashed flex items-center justify-center gap-4 transition-all ${proofImage ? 'border-(--success)/40 bg-(--success)/5' : 'border-(--border) bg-(--surface-2) group-hover:border-(--accent)'}`}>
                        {proofImage
                          ? <><ShieldCheck className="text-(--success) w-5 h-5" /><span className="text-[10px] font-bold text-(--success) uppercase truncate max-w-[200px]">{proofImage.name}</span></>
                          : <><Camera className="text-(--text-tertiary) w-5 h-5" /><span className="text-[10px] font-black text-(--text-tertiary) uppercase">Attach Screenshot</span></>
                        }
                      </div>
                      {proofPreview && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          className="mt-2 p-1 bg-(--surface-3) border border-(--border) rounded-md overflow-hidden">
                          <img src={proofPreview} alt="Proof Preview" className="w-full h-32 object-cover rounded" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <button onClick={handleDeposit} disabled={submitting || !depositAmount || !proofImage}
                    className="w-full h-14 rounded-md bg-(--accent) text-(--text-inverse) font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Submitting...' : dict?.wallet?.deposit_btn || 'Submit Deposit'}
                  </button>
                </motion.div>
              )}

              {/* WITHDRAWAL */}
              {activeTab === 'withdrawal' && (
                <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Channel</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentMethods.map((m) => (
                        <button key={m.id} onClick={() => setSelectedMethod(m)}
                          className={`p-4 rounded-md border text-left transition-all flex items-center justify-between ${selectedMethod?.id === m.id ? 'border-(--accent) bg-(--accent)/5' : 'border-(--border) bg-(--surface-2)'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMethod?.id === m.id ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>{m.name}</span>
                          {selectedMethod?.id === m.id && <CheckCircle2 size={14} className="text-(--accent)" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Amount ({currency})</label>
                    <input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-14 bg-(--surface-2) border border-(--border) rounded-md px-6 text-xl font-bold text-(--text-primary) focus:border-(--accent) outline-none transition-all" />
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[9px] text-[#555] uppercase tracking-widest font-black">Min: {formatCurrency(1, currency)} · Max: {formatCurrency(100, currency)}</p>
                      <p className="text-[9px] text-[#555] uppercase tracking-widest font-black">Available: {formatCurrency(data?.balances?.main || 0, currency)}</p>
                    </div>
                    {withdrawUSD > 0 && (
                      <p className="text-[10px] text-(--text-tertiary) px-1">
                        ≈ <span className="font-bold text-(--text-primary)">${withdrawUSD.toFixed(2)} USD</span> deducted from balance
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Destination Address</label>
                    <input type="text" value={withdrawalAddress} onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="Wallet address, phone, or account number"
                      className="w-full h-12 bg-(--surface-2) border border-(--border) rounded-md px-4 text-xs font-mono text-(--text-primary) outline-none focus:border-(--accent) transition-all" />
                  </div>

                  <button onClick={handleWithdrawal} disabled={submitting || !withdrawalAmount}
                    className="w-full h-14 rounded-md bg-(--accent) text-[#06060a] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] transition-all shadow-xl shadow-(--accent)/10 disabled:opacity-50 flex items-center justify-center gap-3">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight size={16} />}
                    {dict?.wallet?.submit || 'Submit Withdrawal'}
                  </button>
                </motion.div>
              )}

              {/* TRANSFER */}
              {activeTab === 'transfer' && (
                <motion.div key="transfer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="p-6 rounded-md bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-md flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">{dict?.wallet?.transfer_title || 'Internal Transfer'}</h3>
                    <p className="text-[10px] text-[#555] leading-relaxed uppercase font-bold tracking-widest">{dict?.wallet?.transfer_desc || 'Move funds from main balance into game balance.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-md bg-(--surface-2) border border-(--border)">
                      <p className="text-[9px] font-black text-(--text-tertiary) uppercase tracking-widest mb-1">Main Balance</p>
                      <p className="text-base font-black text-(--text-primary)">{formatCurrency(data?.balances?.main || 0, currency)}</p>
                    </div>
                    <div className="p-3 rounded-md bg-(--purple)/5 border border-(--purple)/20">
                      <p className="text-[9px] font-black text-(--text-tertiary) uppercase tracking-widest mb-1">Game Balance</p>
                      <p className="text-base font-black text-(--purple)">{formatCurrency(data?.balances?.game || 0, currency)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(--text-secondary) uppercase tracking-widest px-1">Amount ({currency})</label>
                    <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-14 bg-(--surface-2) border border-(--border) rounded-md px-6 text-xl font-bold text-center text-(--text-primary) focus:border-blue-500/50 outline-none transition-all" />
                    {transferUSD > 0 && (
                      <p className="text-[10px] text-center text-(--text-tertiary)">
                        ≈ <span className="font-bold text-(--text-primary)">${transferUSD.toFixed(2)} USD</span> moved between balances
                      </p>
                    )}
                  </div>

                  <button onClick={handleTransfer} disabled={submitting || !transferAmount}
                    className="w-full h-14 rounded-md bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft size={16} />}
                    {dict?.wallet?.transfer_btn || 'Transfer Funds'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {viewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-(--bg-base)/80 backdrop-blur-sm"
            onClick={() => setViewImage(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[90vh] bg-(--surface) border border-(--border) rounded-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-(--border) flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-(--accent)">Verification Proof</h3>
                <button onClick={() => setViewImage(null)} className="p-2 bg-(--surface-2) text-(--text-primary) hover:bg-(--surface-3) rounded-lg transition-colors"><X size={16} /></button>
              </div>
              <div className="p-4 overflow-auto flex-1 flex justify-center items-center bg-(--surface-2)">
                <img src={viewImage} alt="Payment Proof" className="max-w-full max-h-full object-contain rounded-md" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}