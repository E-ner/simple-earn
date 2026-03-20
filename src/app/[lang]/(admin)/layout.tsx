import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ lang: string }> }) {
  const session = await getServerSession(authOptions)
  const { lang } = await params

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(`/${lang}/dashboard`)
  }

  return (
    <div className="flex h-screen bg-(--bg-base) overflow-hidden">
      <AdminSidebar lang={lang} />
      <main className="flex-1 overflow-y-auto bg-(--bg-elevated)">
        {children}
      </main>
    </div>
  )
}
