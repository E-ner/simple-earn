'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Loader2, ArrowLeft, Camera, Send } from 'lucide-react'
import { activateAccountWithProof, getPaymentMethods, getWalletData } from '@/app/actions/walletActions'
import { useParams, useRouter } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/dictionary'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatRaw, getCurrencyFromCountry, convertToUSD } from '@/lib/currency'

// Activation fee in USD — convert to local for display
const ACTIVATION_FEE_USD = 1

export default function ActivatePage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [country, setCountry] = useState('US')
  const [dict, setDict] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')

  const { lang } = useParams()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const [walletData, dictionary, methods] = await Promise.all([
          getWalletData(),
          getDictionary(lang as Locale),
          getPaymentMethods()
        ])
        setCountry(walletData.country || 'US')
        setDict(dictionary)
        setPaymentMethods(methods)
        if (methods.length > 0) setSelectedMethod(methods[0])

        if (walletData?.user?.isActivated) {
          router.push(`/${lang}/dashboard/wallet`)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [lang, router])

  useEffect(() => {
    if (proofImage) {
      const url = URL.createObjectURL(proofImage)
      setProofPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setProofPreview(null)
    }
  }, [proofImage])

  const currency = getCurrencyFromCountry(country)
  // Show activation fee in local currency
  const feeInLocal = ACTIVATION_FEE_USD * (1 / convertToUSD(1, currency) === Infinity ? 1 : 1 / convertToUSD(1, currency))
  // Simpler: use convertUsd from currency lib
  const localAmt = Number(amount) || 0
  const usdPreview = localAmt > 0 ? convertToUSD(localAmt, currency) : 0

  const handleActivation = async () => {
    if (!selectedMethod) return showToast('Select a payment method', 'ERROR')
    if (!proofImage) return showToast('Please upload payment proof', 'ERROR')
    if (!amount || Number(amount) <= 0) return showToast(`Enter the amount you paid in ${currency}`, 'ERROR')

    setSubmitting(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proofImage)
      })

      // activateAccountWithProof expects localAmount — it converts to USD internally
      const res = await activateAccountWithProof(
        selectedMethod.name,
        reference,
        base64,
        Number(amount)
      ) as any

      if (res?.error) throw new Error(res.error)
      showToast(dict?.wallet?.activation_initiated || 'Activation request submitted. Pending review.', 'SUCCESS')
      router.push(`/${lang}/dashboard/wallet`)
    } catch (error: any) {
      showToast(error.message || 'Activation failed', 'ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-(--bg-base)">
      <Loader2 className="w-8 h-8 text-(--accent) animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-(--bg-base) py-8 px-4 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 border border-white/5 rounded-md flex items-center justify-center text-[#555] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase">Account Activation</h1>
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* Fee summary */}
          <div className="p-6 rounded-md bg-[#0a0a0f] border border-white/[0.04] space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-[#555] uppercase">
              <span>Activation Fee</span>
              <div className="text-right">
                <span className="text-white block">{formatCurrency(ACTIVATION_FEE_USD, currency)}</span>
                <span className="text-[#444] text-[9px]">≈ ${ACTIVATION_FEE_USD.toFixed(2)} USD</span>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <p className="text-[11px] text-[#888] leading-relaxed">
              Pay the one-time activation fee to unlock your account. Enter the exact amount you sent in {currency}.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Payment Channel</label>
            <div className="grid grid-cols-1 gap-2">
              {paymentMethods.map((m) => (
                <button key={m.id} onClick={() => setSelectedMethod(m)}
                  className={`p-4 rounded-md border text-left transition-all flex items-center justify-between ${selectedMethod?.id === m.id ? 'border-(--accent) bg-(--accent)/5' : 'border-white/5 bg-[#0d0d14]'}`}>
                  <span className={`text-xs font-bold ${selectedMethod?.id === m.id ? 'text-white' : 'text-[#888]'}`}>{m.name}</span>
                  {selectedMethod?.id === m.id && <Zap size={14} className="text-(--accent)" />}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {selectedMethod?.instructions && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-md bg-(--accent)/[0.02] border border-(--accent)/10">
              <h4 className="text-[10px] font-black text-(--accent) uppercase tracking-widest mb-2">Instructions</h4>
              <p className="text-[11px] text-[#888] whitespace-pre-line font-mono leading-tight uppercase select-all">
                {selectedMethod.instructions}
              </p>
            </motion.div>
          )}

          {/* Amount input in local currency */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">
              Amount You Paid ({currency})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full h-14 bg-black border border-white/5 rounded-md px-6 text-xl font-bold text-white focus:border-(--accent) outline-none transition-all"
            />
            {usdPreview > 0 && (
              <p className="text-[10px] text-[#555] px-1">
                ≈ <span className="font-bold text-white">${usdPreview.toFixed(2)} USD</span> will be recorded
              </p>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Reference (Optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TX ID / Receipt Number"
              className="w-full h-12 bg-black border border-white/5 rounded-md px-4 text-xs font-mono text-white outline-none focus:border-(--accent) transition-all"
            />
          </div>

          {/* Proof Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Payment Proof (Screenshot)</label>
            <div className="relative group">
              <input type="file" accept="image/*"
                onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className={`h-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${proofImage ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-black group-hover:border-white/10'}`}>
                {proofImage ? (
                  <><ShieldCheck className="text-green-500" /><span className="text-[10px] font-bold text-green-500 uppercase truncate max-w-xs">{proofImage.name}</span></>
                ) : (
                  <><Camera className="text-[#333]" /><span className="text-[10px] font-black text-[#333] uppercase">Attach Receipt Image</span></>
                )}
              </div>
              {proofPreview && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mt-2 p-1 bg-[#0a0a0f] border border-white/5 rounded-md overflow-hidden">
                  <img src={proofPreview} alt="Proof Preview" className="w-full h-32 object-cover rounded" />
                </motion.div>
              )}
            </div>
          </div>

          <button
            onClick={handleActivation}
            disabled={submitting || !amount || !proofImage}
            className="w-full h-14 rounded-md bg-(--accent) text-[#06060a] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={16} />}
            {submitting ? 'Submitting...' : 'Submit Activation Proof'}
          </button>
        </motion.div>

        <footer className="pt-8 text-center">
          <p className="text-[9px] text-[#333] uppercase font-black tracking-[0.2em]">Secure Transmission · Verified Processing</p>
        </footer>
      </div>
    </div>
  )
}