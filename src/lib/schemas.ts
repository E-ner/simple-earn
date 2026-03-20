import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  country: z.string(),
  phone: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const profileSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional()
})
