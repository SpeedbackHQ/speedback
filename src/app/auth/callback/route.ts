import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/admin'

  if (code) {
    const cookieStore = request.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create user profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: data.user.id,
            display_name: data.user.user_metadata.display_name || data.user.email?.split('@')[0] || 'User',
            plan_type: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
      }
    }

    if (!error) {
      // Redirect to the requested page or dashboard
      return NextResponse.redirect(new URL(redirect, requestUrl.origin))
    }
  }

  // Error or no code - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
