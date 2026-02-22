export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  return null
}

export function validatePassword(password: string): {
  error: string | null
  strength: 'weak' | 'fair' | 'strong'
  checks: { label: string; met: boolean }[]
} {
  const checks = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number or symbol', met: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const metCount = checks.filter(c => c.met).length

  let strength: 'weak' | 'fair' | 'strong' = 'weak'
  if (metCount >= 3) strength = 'strong'
  else if (metCount >= 2) strength = 'fair'

  const error = password.length < 6 ? 'Password must be at least 6 characters' : null

  return { error, strength, checks }
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`
  return null
}

export function validateMatch(value: string, compare: string, fieldName: string): string | null {
  if (value !== compare) return `${fieldName} do not match`
  return null
}
