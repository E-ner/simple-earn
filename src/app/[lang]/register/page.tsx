'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Quick utility for mock country dropdown
const COUNTRIES = [
  { code: 'RW', name: 'Rwanda' },
  { code: 'UG', name: 'Uganda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'BI', name: 'Burundi' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'SO', name: 'Somalia' },
  { code: 'CD', name: 'DR Congo' },
  { code: 'DJ', name: 'Djibouti' }
]

export default function RegisterWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMSG, setErrorMSG] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: 'RW',
    phone: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const nextStep = () => {
    setErrorMSG(null)
    if (step === 1 && !formData.email.includes('@')) {
       setErrorMSG('Please enter a valid email.')
       return
    }
    if (step === 2 && (formData.password.length < 6 || formData.password !== formData.confirmPassword)) {
      setErrorMSG('Passwords must be at least 6 characters and match.')
      return
    }
    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setErrorMSG(null)
    if (step > 1) setStep(prev => prev - 1)
  }

  const submitRegistration = async () => {
    setIsSubmitting(true)
    setErrorMSG(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          country: formData.country,
          phone: formData.phone
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register')
      
      // Successfully registered, go to login
      router.push('/en/login')
    } catch (err: any) {
      setErrorMSG(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-(--bg-base) flex flex-col items-center justify-center p-6 sm:p-12 font-learn">
      <div className="w-full max-w-md bg-(--surface) border border-(--border) rounded-xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Step Indicators */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1,2,3].map(s => (
            <div 
              key={s} 
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-(--accent)' : 'bg-(--surface-3)'}`}
              aria-label={`Step ${s}`}
            />
          ))}
        </div>

        <h2 className="text-3xl font-display font-bold tracking-tight text-(--text-primary) text-center mb-6">
          {step === 1 && "Create your account"}
          {step === 2 && "Choose your details"}
          {step === 3 && "Where are you from?"}
        </h2>

        {errorMSG && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-sm">
            <p className="text-sm text-(--error) text-center font-medium" role="alert">{errorMSG}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Step 1: Email */}
          {step === 1 && (
            <div className="animate-fade-up">
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Email Address</label>
              <input 
                name="email" value={formData.email} onChange={handleChange} 
                type="email" placeholder="hello@example.com" className="input" autoFocus
              />
              <button className="btn-primary w-full btn-lg mt-6" onClick={nextStep} data-testid="next-btn-1">Continue</button>
            </div>
          )}

          {/* Step 2: Username & Password */}
          {step === 2 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Username</label>
                <input name="username" value={formData.username} onChange={handleChange} type="text" placeholder="creative_name" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Password</label>
                <input name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Confirm Password</label>
                <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" placeholder="••••••••" className="input" />
              </div>
              <div className="flex gap-4 mt-6">
                <button className="btn-secondary flex-1 btn-lg" onClick={prevStep}>Back</button>
                <button className="btn-primary flex-2 btn-lg" onClick={nextStep} data-testid="next-btn-2">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Country & Phone */}
          {step === 3 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Country</label>
                <select name="country" value={formData.country} onChange={handleChange} className="input">
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">Phone Number (Optional)</label>
                <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="+1 (555) 000-0000" className="input" />
              </div>
              <div className="flex gap-4 mt-6">
                <button className="btn-secondary flex-1 btn-lg" onClick={prevStep} disabled={isSubmitting}>Back</button>
                <button className="btn-primary flex-2 btn-lg" onClick={submitRegistration} disabled={isSubmitting} data-testid="submit-register">
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

        </div>

        {step === 1 && (
          <p className="text-center text-sm text-(--text-secondary) mt-6">
            Already have an account? <Link href="/en/login" className="font-medium text-(--text-primary) hover:text-(--accent) transition-colors">Log in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
