import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ lang: string }> }) {
  const session = await getServerSession(authOptions)
  const { lang } = await params

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(`/${lang}/dashboard`)
  }

  return (
    <AdminLayoutClient lang={lang}>
      {children}
    </AdminLayoutClient>
  )
}
