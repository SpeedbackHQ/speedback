import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create a Supabase client for use in Server Components
 * Handles cookie-based sessions automatically
 */
export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing sessions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component
            // This can be ignored if you have middleware refreshing sessions
          }
        },
      },
    }
  )
})

/**
 * Get the current user from the session (server-side)
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current user's session (server-side)
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components that require auth
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    // This will be handled by middleware, but good to have as backup
    throw new Error('Unauthorized - please log in')
  }

  return user
}

/**
 * Get the user's profile from user_profiles table
 * Returns null if not found
 */
export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(userId: string, profile: {
  display_name?: string
  plan_type?: 'free' | 'starter' | 'per-event'
  stripe_customer_id?: string
}) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data
}

/**
 * Get the user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) {
    // No active subscription = free tier
    return null
  }

  return data
}
