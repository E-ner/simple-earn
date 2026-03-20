'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { profileSchema } from '@/lib/schemas'

export async function updateProfile(data: { username?: string, email?: string, phone?: string, country?: string, language?: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = profileSchema.parse(data)

  await prisma.user.update({
    where: { id: session.user.id },
    data: validated
  })

  revalidatePath('/dashboard/profile')
  revalidatePath('/')
  return { success: true }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user || !user.passwordHash) throw new Error('User not found')

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isMatch) throw new Error('Current password incorrect')

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashedPassword }
  })

  return { success: true }
}

export async function deleteAccount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.user.delete({
    where: { id: session.user.id }
  })

  return { success: true }
}
