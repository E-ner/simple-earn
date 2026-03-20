import { getAllUsers } from '@/app/actions/adminActions'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { users, total, pages } = await getAllUsers(1)
  return <AdminUsersClient initialUsers={users} total={total} pages={pages} lang={lang} />
}
