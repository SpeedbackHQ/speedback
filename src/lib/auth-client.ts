import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance to avoid multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Create a Supabase client for use in Client Components
 * Use this in 'use client' components
 * Returns a singleton instance to avoid multiple GoTrueClient instances
 * Uses SSR-compatible client with proper cookie handling
 */
export function createBrowserSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
