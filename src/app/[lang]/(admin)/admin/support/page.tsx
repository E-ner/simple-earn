import { getAllTickets } from '@/app/actions/supportActions'
import { SupportClient } from '@/components/admin/SupportClient'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  const tickets = await getAllTickets()
  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-black text-(--text-primary) tracking-tight">Support Inquiries</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">Review user feedback and resolve tickets.</p>
      </div>
      <SupportClient initialTickets={tickets} />
    </div>
  )
}
