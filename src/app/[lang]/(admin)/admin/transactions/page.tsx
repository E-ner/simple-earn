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
        <h1 className="text-2xl font-black text-(--text-primary) tracking-tighter">
          All Transactions <span className="text-(--text-tertiary)">({total})</span>
        </h1>
      </div>

      {/* Start of the new structure based on the provided snippet */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 rounded-md bg-(--surface) text-(--text-primary) border border-(--border) flex items-center px-4 h-12">
          <Search className="w-5 h-5 text-(--text-tertiary) mr-3" />
          <input
            type="text"
            placeholder="Search tx ID, User ID..."
            className="bg-transparent border-none outline-none w-full text-sm font-mono placeholder-(--text-tertiary)"
          />
        </div>
      </div>
      {/* End of the new structure */}

      <TransactionsTable transactions={transactions} />
    </div>
  )
}
