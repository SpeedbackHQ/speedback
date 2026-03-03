'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import { validateEmail, validatePassword, validateMatch } from '@/lib/validation'
import { humanizeError } from '@/lib/error-messages'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Field-level validation errors (shown on blur)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
  // Track which fields have been touched (blurred at least once)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const supabase = createBrowserSupabaseClient()

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    let error: string | null = null
    switch (field) {
      case 'email':
        error = validateEmail(email)
        break
      case 'password':
        error = validatePassword(password).error
        break
      case 'confirmPassword':
        error = password && confirmPassword ? validateMatch(confirmPassword, password, 'Passwords') : null
        break
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  // Clear field error when user corrects input
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'email': setEmail(value); break
      case 'password': setPassword(value); break
      case 'confirmPassword': setConfirmPassword(value); break
      case 'displayName': setDisplayName(value); break
    }

    // Clear error if field was touched and is now valid
    if (touched[field]) {
      let error: string | null = null
      switch (field) {
        case 'email':
          error = validateEmail(value)
          break
        case 'password':
          error = validatePassword(value).error
          break
        case 'confirmPassword':
          error = password && value ? validateMatch(value, password, 'Passwords') : null
          break
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password).error
    const matchErr = validateMatch(confirmPassword, password, 'Passwords')

    if (emailErr || passErr || matchErr) {
      setFieldErrors({ email: emailErr, password: passErr, confirmPassword: matchErr })
      setTouched({ email: true, password: true, confirmPassword: true })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })

      if (error) throw error

      // Always redirect to dashboard on successful signup
      // Users can access immediately; verification email sent in background
      if (data.user) {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(humanizeError(err))
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(humanizeError(err))
      setLoading(false)
    }
  }

  const fieldClass = (field: string) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-colors ${
      touched[field] && fieldErrors[field]
        ? 'border-red-300 bg-red-50/30'
        : touched[field] && !fieldErrors[field] && (field === 'email' ? email : field === 'password' ? password : confirmPassword)
        ? 'border-emerald-300'
        : 'border-gray-300'
    }`

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #F8F7FF 0%, #F3EEFF 50%, #EFF6FF 100%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-chonko tracking-tight mb-2 hover:opacity-80 transition-opacity cursor-pointer">
              Speed<span style={{ color: '#8B5CF6' }}>Back</span> ⚡
            </h1>
          </Link>
          <p className="text-gray-600 font-manrope">Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full mb-4 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup}>
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.email && fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={fieldClass('email')}
                  placeholder="you@example.com"
                />
                {touched.email && !fieldErrors.email && email && (
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {touched.email && fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                required
                aria-required="true"
                aria-invalid={!!(touched.password && fieldErrors.password)}
                aria-describedby="password-strength"
                className={fieldClass('password')}
                placeholder="••••••••"
              />
              <div id="password-strength">
                <PasswordStrength password={password} />
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.confirmPassword && fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                  className={fieldClass('confirmPassword')}
                  placeholder="••••••••"
                />
                {touched.confirmPassword && !fieldErrors.confirmPassword && confirmPassword && (
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <ButtonSpinner className="text-white" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-500 hover:text-violet-600 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
