'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import { motion, AnimatePresence } from 'framer-motion'

interface VerificationBannerProps {
  userEmail: string
}

export function VerificationBanner({ userEmail }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const handleResend = async () => {
    setResending(true)
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } catch (error) {
      console.error('Failed to resend verification:', error)
    } finally {
      setResending(false)
    }
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-amber-50 border-b border-amber-200"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm text-amber-800 font-medium">
                Please verify your email address
              </p>
              <p className="text-xs text-amber-700 truncate">
                We sent a verification link to <strong>{userEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resent ? (
              <span className="text-sm text-green-600 font-medium">✓ Email sent!</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-amber-700 hover:text-amber-900 font-medium underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend email'}
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-800 p-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
