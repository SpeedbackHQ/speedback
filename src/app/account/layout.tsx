'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { User } from '@supabase/supabase-js'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30">
      {/* Header - matches admin style */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-violet-100/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-chonko tracking-tight" style={{ color: '#0F172A' }}>
            Speed<span style={{ color: '#8B5CF6' }}>Back</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className={`font-outfit font-medium transition-colors px-3 py-2 rounded-lg ${
                pathname === '/admin'
                  ? 'text-violet-500 bg-violet-50'
                  : 'text-slate-600 hover:text-violet-500 hover:bg-violet-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              className={`font-outfit font-medium transition-colors px-3 py-2 rounded-lg ${
                pathname?.startsWith('/admin/templates')
                  ? 'text-violet-500 bg-violet-50'
                  : 'text-slate-600 hover:text-violet-500 hover:bg-violet-50'
              }`}
            >
              Templates
            </Link>
            <Link
              href="/admin/playground"
              className={`font-outfit font-medium transition-colors px-3 py-2 rounded-lg ${
                pathname?.startsWith('/admin/playground')
                  ? 'text-violet-500 bg-violet-50'
                  : 'text-slate-600 hover:text-violet-500 hover:bg-violet-50'
              }`}
            >
              Playground
            </Link>
            <Link
              href="/admin/surveys/new"
              className="btn-primary"
            >
              + New Survey
            </Link>

            {/* User Dropdown */}
            {user && (
              <div className="relative ml-2">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">Free Plan</p>
                      </div>
                      <Link
                        href="/account/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Account
                      </Link>
                      <Link
                        href="/account/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Billing
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Decorative accent bar - matches admin */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500" />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
