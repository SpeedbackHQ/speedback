import { createBrowserSupabaseClient } from '@/lib/auth-client'

/**
 * Check if the current user has verified their email
 * Use this before sensitive actions like publishing surveys or billing
 */
export async function requireEmailVerification(): Promise<{
  verified: boolean
  user: any | null
  message?: string
}> {
  const supabase = createBrowserSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      verified: false,
      user: null,
      message: 'Please log in to continue',
    }
  }

  if (!user.email_confirmed_at) {
    return {
      verified: false,
      user,
      message: 'Please verify your email address before continuing. Check your inbox for a verification link.',
    }
  }

  return {
    verified: true,
    user,
  }
}

/**
 * UI helper: Show an alert if verification is required
 * Returns true if verified, false if not (and shows alert)
 */
export async function checkVerificationWithAlert(): Promise<boolean> {
  const result = await requireEmailVerification()

  if (!result.verified && result.message) {
    alert(result.message)
    return false
  }

  return true
}
