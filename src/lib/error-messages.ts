const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please verify your email address first. Check your inbox for the confirmation link.',
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Signup requires a valid password': 'Please enter a valid password (at least 6 characters).',
  'Email rate limit exceeded': 'Too many attempts. Please wait a minute and try again.',
  'For security purposes, you can only request this after': 'Please wait a moment before trying again.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'New password should be different from the old password': 'Your new password must be different from your current password.',
}

export function humanizeError(error: { message?: string; code?: string } | string): string {
  const message = typeof error === 'string' ? error : error.message || ''

  // Check for exact match first
  if (ERROR_MAP[message]) return ERROR_MAP[message]

  // Check for partial match
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return friendly
  }

  // Fallback — clean up the message
  if (message) return message.replace(/^(AuthApiError|AuthError):\s*/i, '')

  return 'Something went wrong. Please try again.'
}
