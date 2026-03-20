'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownLeft, History, DollarSign, ShieldCheck, Landmark, Loader2, ArrowRightLeft, Sparkles, Zap } from 'lucide-react'
import { getWalletData, requestWithdrawal, transferToGameBalance, initiateDeposit, getPaymentMethods } from '@/app/actions/walletActions'
import { Camera, Send } from 'lucide-react'
import { formatCurrency, getCurrencyFromCountry } from '@/lib/currency'
import { useParams, useRouter } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'

export default function WalletPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [activeTab, setActiveTab ] = useState<'history' | 'withdrawal' | 'transfer' | 'deposit'>('history')
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
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
    async function loadResources() {
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
      } catch (error) {
        console.error('Failed to load wallet data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadResources()
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

  const handleWithdrawal = async () => {
    if (!amount || Number(amount) < 5) {
      showToast('Minimum withdrawal is $5.00', 'ERROR')
      return
    }
    if (!selectedMethod) return showToast('Select payout channel', 'ERROR')

    if (!withdrawalAddress) return showToast('Enter destination address/account', 'ERROR')

    setSubmitting(true)
    try {
      const result = await requestWithdrawal(Number(amount), selectedMethod.name, withdrawalAddress)
      if (result.success) {
        showToast('Withdrawal request submitted for audit.', 'SUCCESS')
        const walletData = await getWalletData()
        setData(walletData)
        setAmount('')
        setActiveTab('history')
      }
    } catch (error: any) {
      showToast(error.message || 'Withdrawal failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivation = async () => {
    if (!selectedMethod) return showToast('Select payment channel', 'ERROR')
    if (!proofImage) return showToast('Payment proof required', 'ERROR')

    setSubmitting(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proofImage)
      })

      const res = await activateAccountWithProof(selectedMethod.name, depositRef, base64) as any
      if (res.error) throw new Error(res.error)
      showToast('Activation request sent. Audit in progress.', 'SUCCESS')
      const walletData = await getWalletData()
      setData(walletData)
      setProofImage(null)
      setDepositRef('')
    } catch (error: any) {
      showToast(error.message || 'Activation request failed', 'ERROR')
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
      const walletData = await getWalletData()
      setData(walletData)
      setTransferAmount('')
      setActiveTab('history')
    } catch (error: any) {
      showToast(error.message || 'Transfer failed', 'ERROR')
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
      showToast('Preparing transmission...', 'INFO')
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proofImage)
      })

      const res = await initiateDeposit(Number(depositAmount), selectedMethod.name, base64, depositRef) as any
      if (res.error) throw new Error(res.error)
      showToast(dict?.wallet?.deposit_success || 'Injection protocol initiated! Awaiting audit.', 'SUCCESS')
      const walletData = await getWalletData()
      setData(walletData)
      setDepositAmount('')
      setDepositRef('')
      setProofImage(null)
      setActiveTab('history')
    } catch (error: any) {
      showToast(error.message || 'Deposit failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  )

  const currency = getCurrencyFromCountry(data?.country || 'US')

  return (
    <div className="pb-20">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">{dict?.wallet?.title || 'Financial Hub'}</h1>
        <p className="text-[#888] max-w-2xl">
          {dict?.wallet?.desc || 'Manage your verified assets.'}
        </p>
      </header>

      {/* Activation Banner */}
      {!(data?.user?.isActivated || data?.user?.isActive || data?.transactions?.some((tx: any) => tx.type === 'ACTIVATION' && tx.status === 'APPROVED')) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-md bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{dict?.wallet?.activate_title || 'Account Activation Required'}</h3>
              <p className="text-xs text-[#888] max-w-md">{dict?.wallet?.activate_desc || 'Initialize your account for a one-time protocol fee of $1.00.'}</p>
            </div>
          </div>
          <button 
            onClick={handleActivation}
            disabled={submitting}
            className="h-11 px-8 bg-orange-500 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {dict?.wallet?.activate_btn || 'Initialize Node Now'}
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-8 rounded-md bg-gradient-to-br from-[var(--accent)]/10 to-[#0d0d14] border border-[var(--accent)]/10 relative overflow-hidden">
             <div className="absolute inset-0 bg-[var(--accent)] opacity-[0.03] blur-3xl rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform" />
             <div className="relative z-10 text-center">
                <div className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-4">
                  {dict?.wallet?.current_assets || 'Current Assets'}
                </div>
                <div className="text-5xl font-bold text-white tracking-tighter mb-2">
                  {formatCurrency(data?.balances?.total, currency)}
                </div>
                <p className="text-xs text-[#888]">Verified Principal</p>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                  <div>
                    <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
                      {dict?.dashboard?.balances?.main || 'Main'}
                    </div>
                    <div className="text-lg font-bold text-white">{formatCurrency(data?.balances?.main, currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
                      {dict?.dashboard?.balances?.game || 'Game'}
                    </div>
                    <div className="text-lg font-bold text-[var(--purple)]">{formatCurrency(data?.balances?.game, currency)}</div>
                  </div>
                </div>
             </div>
          </div>

          <div className="p-6 rounded-md bg-[#16161e] border border-white/[0.06] flex items-center gap-4">
             <div className={`w-10 h-10 rounded-md flex items-center justify-center text-sm ${data?.user?.isActivated ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {data?.user?.isActivated ? <ShieldCheck /> : <History />}
             </div>
             <div>
                <p className="text-xs font-bold text-white">
                  {data?.user?.isActivated ? 'Protocol Verified' : 'Initialization Pending'}
                </p>
                <p className="text-[10px] text-[#555] uppercase">{data?.country} Node</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-1 flex flex-col min-h-[500px]">
          <div className="flex border-b border-white/[0.05] overflow-x-auto">
             <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'history' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[#555] hover:text-[#888]'}`}
             >
                {dict?.wallet?.history || 'Audit Log'}
             </button>
             <button 
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'deposit' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[#555] hover:text-[#888]'}`}
             >
                {dict?.wallet?.deposit_game || 'Deposit'}
             </button>
             <button 
                onClick={() => setActiveTab('withdrawal')}
                className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'withdrawal' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[#555] hover:text-[#888]'}`}
             >
                {dict?.wallet?.withdraw || 'Capital Exit'}
             </button>
             <button 
                onClick={() => setActiveTab('transfer')}
                className={`flex-1 min-w-[100px] py-4 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'transfer' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[#555] hover:text-[#888]'}`}
             >
                {dict?.wallet?.transfer_to_game || 'Transfer'}
             </button>
          </div>

          <div className="flex-1 p-6 relative">
            <AnimatePresence mode="wait">
              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {data?.transactions?.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.04]">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? 'bg-green-500/10 text-green-500' : tx.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                             {tx.type === 'TRANSFER' ? <ArrowRightLeft size={16} /> : ['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white">{tx.notes || tx.type.replace('_', ' ')}</p>
                             <p className="text-[10px] text-[#555] font-mono">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                       </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className={`text-sm font-bold ${['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? 'text-green-500' : tx.type === 'TRANSFER' ? 'text-blue-400' : 'text-orange-500'}`}>
                             {['EARNING', 'GAME_WIN', 'DEPOSIT'].includes(tx.type) ? '+' : tx.type === 'TRANSFER' ? '~' : '-'}{formatCurrency(tx.amount, currency)}
                          </p>
                          <div className="flex items-center gap-2">
                             {tx.proofImage && (
                               <button 
                                 onClick={() => setSelectedProof(tx.proofImage)}
                                 className="text-[9px] text-[var(--accent)] hover:underline uppercase font-bold tracking-tighter"
                               >
                                 View Receipt
                               </button>
                             )}
                             <p className="text-[10px] text-[#555] uppercase tracking-widest">{tx.status}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  {data?.transactions?.length === 0 && (
                    <div className="py-20 text-center text-[#555] text-[10px] uppercase tracking-[0.2em] font-black">
                      Protocol Log Empty
                    </div>
                  )}
                </motion.div>
              )}

               {activeTab === 'deposit' && (
                <motion.div key="deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-lg mx-auto py-4">
                  
                  {/* Amount Input */}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">{dict?.wallet?.deposit_amount || 'Injection Amount (USD)'}</label>
                     <input 
                       type="number" 
                       value={depositAmount}
                       onChange={(e) => setDepositAmount(e.target.value)}
                       placeholder="0.00" 
                       className="w-full h-14 bg-black border border-white/5 rounded-md px-6 text-xl font-bold text-white focus:border-[var(--accent)] outline-none transition-all"
                     />
                  </div>

                  {/* Payment Methods Grid */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Select Channel</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentMethods.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMethod(m)}
                          className={`p-4 rounded-md border text-left transition-all flex items-center justify-between ${selectedMethod?.id === m.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-white/5 bg-[#0d0d14]'}`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMethod?.id === m.id ? 'text-white' : 'text-[#555]'}`}>{m.name}</span>
                          {selectedMethod?.id === m.id && <Zap size={12} className="text-[var(--accent)]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Instructions */}
                  {selectedMethod && (
                    <div className="p-4 rounded-md bg-white/[0.02] border border-white/5">
                      <h4 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-2">Instructions</h4>
                      <p className="text-[11px] text-[#888] font-mono leading-tight whitespace-pre-line uppercase select-all">
                        {selectedMethod.instructions}
                      </p>
                    </div>
                  )}

                  {/* Reference & Proof */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">{dict?.wallet?.pay_ref || 'Injection Reference'}</label>
                      <input 
                        type="text" 
                        value={depositRef}
                        onChange={(e) => setDepositRef(e.target.value)}
                        placeholder="Receipt ID / TX Hash" 
                        className="w-full h-12 bg-black border border-white/5 rounded-md px-4 text-xs font-mono text-white outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Payment Proof</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`h-24 rounded-md border-2 border-dashed flex items-center justify-center gap-4 transition-all ${proofImage ? 'border-green-500/40 bg-green-500/5' : 'border-white/5 bg-black group-hover:border-white/10'}`}>
                           {proofImage ? (
                             <>
                               <ShieldCheck className="text-green-500 w-5 h-5" />
                               <span className="text-[10px] font-bold text-green-500 uppercase truncate max-w-[200px]">{proofImage.name}</span>
                             </>
                           ) : (
                             <>
                               <Camera className="text-[#333] w-5 h-5" />
                               <span className="text-[10px] font-black text-[#333] uppercase">Attach Screenshot</span>
                             </>
                           )}
                        </div>
                        {proofPreview && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 p-1 bg-white/5 border border-white/10 rounded-md overflow-hidden"
                          >
                            <img src={proofPreview} alt="Proof Preview" className="w-full h-32 object-cover rounded" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleDeposit}
                    disabled={submitting || !depositAmount || !proofImage}
                    className="w-full h-14 rounded-md bg-[var(--accent)] text-[#06060a] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent)]/10"
                  >
                     {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={16} />}
                     {submitting ? 'Transmitting...' : dict?.wallet?.deposit_btn || 'Initialize Injection'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'withdrawal' && (
                <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">
                       {dict?.wallet?.payout_channel || 'Select Payout Channel'}
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {paymentMethods.map((m) => (
                          <button 
                            key={m.id}
                            onClick={() => setSelectedMethod(m)}
                            className={`p-4 rounded-md border text-left transition-all flex items-center justify-between ${selectedMethod?.id === m.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-white/5 bg-[#0d0d14]'}`}
                          >
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMethod?.id === m.id ? 'text-white' : 'text-[#555]'}`}>{m.name}</span>
                             {selectedMethod?.id === m.id && <Zap size={12} className="text-[var(--accent)]" />}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Amount (USD)</label>
                     <input 
                       type="number" 
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       placeholder="Min. $5.00" 
                       className="w-full h-14 bg-black border border-white/5 rounded-md px-6 text-xl font-bold text-white focus:border-[var(--accent)] outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Destination Address / Account</label>
                     <input 
                       type="text" 
                       value={withdrawalAddress}
                       onChange={(e) => setWithdrawalAddress(e.target.value)}
                       placeholder="e.g. Wallet Address, Email, or Phone" 
                       className="w-full h-12 bg-black border border-white/5 rounded-md px-4 text-xs font-mono text-white outline-none focus:border-[var(--accent)] transition-all"
                     />
                     <p className="text-[9px] text-center text-[#555] uppercase tracking-widest font-black">Estimated Local: {formatCurrency(Number(amount) || 0, currency)}</p>
                  </div>
                  <button 
                    onClick={handleWithdrawal}
                    disabled={submitting || !amount}
                    className="w-full h-14 rounded-md bg-[var(--accent)] text-[#06060a] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] transition-all shadow-xl shadow-[var(--accent)]/10 disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight size={16} />}
                     {dict?.wallet?.submit || 'Submit Capital Exit'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'transfer' && (
                <motion.div key="transfer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="p-6 rounded-md bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-md flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">{dict?.wallet?.transfer_title || 'Internal Ecosystem Transfer'}</h3>
                    <p className="text-[10px] text-[#555] leading-relaxed uppercase font-bold tracking-widest">{dict?.wallet?.transfer_desc || 'Convert main principal into gaming tokens.'}</p>
                  </div>

                  <div className="space-y-2">
                     <input 
                       type="number" 
                       value={transferAmount}
                       onChange={(e) => setTransferAmount(e.target.value)}
                       placeholder="Transfer Amount (USD)" 
                       className="w-full h-14 bg-black border border-white/5 rounded-md px-6 text-xl font-bold text-center text-white focus:border-blue-500/50 outline-none transition-all"
                     />
                  </div>
                  <button 
                    onClick={handleTransfer}
                    disabled={submitting || !transferAmount}
                    className="w-full h-14 rounded-md bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft size={16} />}
                     {dict?.wallet?.transfer_btn || 'Initialize Transfer'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProof(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                onClick={() => setSelectedProof(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
               >
                 <XCircle />
               </button>
               <img src={selectedProof} alt="Proof Full" className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
