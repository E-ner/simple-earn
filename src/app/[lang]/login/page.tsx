'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginSchema } from '@/lib/schemas'
import { z } from 'zod'

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setError(null)
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (result?.error) {
        if (result.error === 'ACCOUNT_SUSPENDED') {
          router.push('/en/suspended' as any)
        } else if (result.error === 'EMAIL_NOT_VERIFIED') {
          router.push(`/en/verify-email?email=${encodeURIComponent(data.email)}` as any)
        } else {
          setError('Invalid email or password')
        }
      } else {
        router.push('/en/dashboard' as any)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-base) flex">
      {/* Left side - Brand/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between border-r border-(--border) relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-(--bg-overlay) to-(--bg-elevated)" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,var(--accent-muted),transparent_50%)]" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-(--accent) flex items-center justify-center">
              <span className="text-(--text-inverse) font-bold text-lg leading-none">S</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-(--text-primary)">Simple Earn</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-display font-bold tracking-tight mb-4 text-(--text-primary)">
            Welcome back to your earning journey.
          </h1>
          <p className="text-(--text-secondary) text-lg">
            Log in to continue completing quizzes, watching videos, and playing token games.
          </p>
        </div>
        
        <div className="relative z-10 text-(--text-tertiary) font-mono text-sm">
          © {new Date().getFullYear()} Simple Earn. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold tracking-tight text-(--text-primary)">Log in</h2>
            <p className="mt-2 text-(--text-secondary)">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5 font-learn">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="hello@example.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-(--error)" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-(--text-secondary) font-learn">
                    Password
                  </label>
                  <Link href={"/en/forgot-password" as any} className="text-sm font-medium text-(--accent) hover:text-(--accent-hover) transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-(--error)" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
                <p className="text-sm text-(--error) text-center font-medium" role="alert">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full btn-lg relative overflow-hidden"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-(--text-secondary)">
            Don't have an account?{' '}
            <Link href={"/en/register" as any} className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
