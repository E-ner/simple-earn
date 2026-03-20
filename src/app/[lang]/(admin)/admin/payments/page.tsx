import { getAllPaymentMethods } from '@/app/actions/adminActions'
import { PaymentsClient } from '@/components/admin/PaymentsClient'
import { Banknote } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const methods = await getAllPaymentMethods()
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-5 h-5 text-[var(--purple)]" />
          <span className="text-[10px] font-black text-[var(--purple)] uppercase tracking-widest">Payment Methods</span>
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Payment Configuration</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage which payment methods users can use for deposits and withdrawals.</p>
      </div>
      <PaymentsClient initialMethods={methods} />
    </div>
  )
}
