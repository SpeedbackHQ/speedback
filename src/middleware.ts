import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user }, error } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/account') ||
      request.nextUrl.pathname.startsWith('/internal')) {
    if (!user || error) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If user is logged in and tries to access login/signup, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/stripe/webhook (Stripe webhooks don't have auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - play/* (public survey pages)
     */
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico|play/).*)',
  ],
}
