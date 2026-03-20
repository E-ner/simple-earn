import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import DashboardShell from "@/components/dashboard/DashboardShell"
import ErrorBoundary from "@/components/ErrorBoundary"
import prisma from "@/lib/prisma"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${lang}/login`)
  }

  // Robust fallback: If username is missing from session (e.g., stale JWT), fetch from DB
  const user = session.user
  if (!user.username) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true }
    })
    if (dbUser) {
      user.username = dbUser.username
    }
  }

  return (
    <DashboardShell user={user}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </DashboardShell>
  )
}
