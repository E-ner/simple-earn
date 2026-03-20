import { getAllTransactions } from '@/app/actions/adminActions'
import TransactionsTable from '@/components/admin/TransactionsTable'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { transactions, total } = await getAllTransactions(1)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-purple-500" />
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Transaction Management</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tighter">
          All Transactions <span className="text-gray-500">({total})</span>
        </h1>
      </div>

      <TransactionsTable transactions={transactions} />
    </div>
  )
}
