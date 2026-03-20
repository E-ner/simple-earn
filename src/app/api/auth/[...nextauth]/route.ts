import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      username: string
      isActive: boolean
      isEmailVerified: boolean
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        // Pass any details to JWT/session layout
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.username = (user as any).username
        token.isActive = (user as any).isActive
        token.isEmailVerified = (user as any).isEmailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.isActive = token.isActive as boolean
        session.user.isEmailVerified = token.isEmailVerified as boolean
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
