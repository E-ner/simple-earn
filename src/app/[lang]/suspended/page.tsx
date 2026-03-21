import React from 'react'
import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-(--bg-base) flex flex-col items-center justify-center p-6 sm:p-12 font-learn">
      <div className="w-full max-w-lg bg-(--surface) border border-(--error)/20 rounded-xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-(--error)/10 flex items-center justify-center mx-auto mb-6">
           <svg className="w-10 h-10 text-(--error)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        
        <h2 className="text-4xl font-display font-bold tracking-tight text-(--text-primary) mb-4">Account Suspended</h2>
        
        <div className="space-y-4 text-left p-6 bg-(--surface-2) rounded-lg border border-(--border) mb-8">
          <p className="text-(--text-secondary) leading-relaxed">
            Your account has been restricted due to a violation of our <b>Terms of Service</b> or suspicious activity detected by our automated protocol monitoring system.
          </p>
          <p className="text-(--text-secondary) leading-relaxed">
            While your account is suspended, you will not be able to:
          </p>
          <ul className="list-disc list-inside text-(--text-tertiary) text-sm space-y-1 ml-2">
            <li>Withdraw funds or deposit tokens</li>
            <li>Access the quiz or video library</li>
            <li>Participate in community games</li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-(--text-tertiary)">
            Think this is a mistake? Contact our compliance department.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link href="mailto:support@smartearn.com" className="btn-primary px-8">
                Contact Support
             </Link>
             <Link href="/en/login" className="btn-secondary px-8">
                Back to Home
             </Link>
          </div>
        </div>
        
        <p className="mt-12 text-[10px] text-(--text-tertiary) font-mono uppercase tracking-widest">
          Protocol ID: ACCESS_RESTRICTED_772
        </p>
      </div>
    </div>
  )
}
