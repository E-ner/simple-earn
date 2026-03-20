import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export default withAuth(
  function middleware(req: any) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Block non-admin users from /admin/* routes
    if (pathname.includes('/admin') && token?.role !== 'ADMIN') {
      const url = req.nextUrl.clone()
      const lang = pathname.split('/')[1] || 'en'
      url.pathname = `/${lang}/dashboard`
      return NextResponse.redirect(url)
    }

    // Block admin users from /dashboard/* routes
    if (pathname.includes('/dashboard') && token?.role === 'ADMIN') {
      const url = req.nextUrl.clone()
      const lang = pathname.split('/')[1] || 'en'
      url.pathname = `/${lang}/admin`
      return NextResponse.redirect(url)
    }
  },
  {
    secret: authOptions.secret,
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = { matcher: ["/:lang/dashboard/:path*", "/:lang/admin/:path*"] }
